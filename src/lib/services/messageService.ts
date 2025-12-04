/**
 * Message Service
 * Handles chat messaging between coaches and clients using the chat_messages table
 */

import { supabase, isSupabaseConfigured } from '../supabase';
import type { ChatMessage, Conversation, MessageType, SenderType, CoachingStatus } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const fetchProfilesByIds = async (userIds: string[]): Promise<Record<string, any>> => {
  if (!supabase || userIds.length === 0) return {};

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url')
      .in('id', userIds);

    if (error) {
      console.warn('[messageService] Error fetching profiles:', error);
      return {};
    }

    const profileMap: Record<string, any> = {};
    (data || []).forEach(p => {
      profileMap[p.id] = p;
    });
    return profileMap;
  } catch (err) {
    console.warn('[messageService] Exception fetching profiles:', err);
    return {};
  }
};

const fetchExpertsByIds = async (expertIds: string[]): Promise<Record<string, any>> => {
  if (!supabase || expertIds.length === 0) return {};

  try {
    const { data, error } = await supabase
      .from('experts')
      .select('id, name, photo_url')
      .in('id', expertIds);

    if (error) {
      console.warn('[messageService] Error fetching experts:', error);
      return {};
    }

    const expertMap: Record<string, any> = {};
    (data || []).forEach(e => {
      expertMap[e.id] = e;
    });
    return expertMap;
  } catch (err) {
    console.warn('[messageService] Exception fetching experts:', err);
    return {};
  }
};

// Transform DB row to ChatMessage
const transformMessage = (row: any, senderInfo?: { name?: string; avatar?: string }): ChatMessage => {
  return {
    id: row.id,
    relationshipId: row.relationship_id,
    senderId: row.sender_id,
    senderType: row.sender_type as SenderType,
    senderName: senderInfo?.name,
    senderAvatar: senderInfo?.avatar,
    content: row.content,
    messageType: (row.message_type || 'text') as MessageType,
    attachmentUrl: row.attachment_url,
    checkinId: row.checkin_id,
    isRead: row.is_read || false,
    readAt: row.read_at,
    sentAt: row.sent_at,
    createdAt: row.created_at,
  };
};

// =============================================================================
// MESSAGE SERVICE
// =============================================================================

export const messageService = {
  /**
   * Fetch all conversations for a coach (relationships with message counts)
   */
  async fetchConversations(coachId: string): Promise<Conversation[]> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    console.log('[messageService] Fetching conversations for coach:', coachId);

    // Fetch all relationships for this coach
    const { data: relationships, error: relError } = await supabase
      .from('coaching_relationships')
      .select('id, user_id, expert_id, status, created_at')
      .eq('expert_id', coachId)
      .order('created_at', { ascending: false });

    if (relError) {
      console.error('[messageService] Error fetching relationships:', relError);
      throw relError;
    }

    if (!relationships || relationships.length === 0) {
      return [];
    }

    // Get unique user IDs
    const userIds = [...new Set(relationships.map(r => r.user_id).filter(Boolean))];
    const relationshipIds = relationships.map(r => r.id);

    // Fetch profiles and unread counts in parallel
    const [profileMap, unreadCounts, lastMessages] = await Promise.all([
      fetchProfilesByIds(userIds),
      this.getUnreadCountsForRelationships(relationshipIds, 'expert'),
      this.getLastMessagesForRelationships(relationshipIds),
    ]);

    // Transform to Conversation objects
    return relationships.map(rel => {
      const profile = profileMap[rel.user_id];
      const lastMsg = lastMessages[rel.id];

      return {
        id: rel.id,
        clientId: rel.user_id,
        clientName: profile?.full_name || profile?.email?.split('@')[0] || 'Unknown',
        clientAvatar: profile?.avatar_url,
        coachId: rel.expert_id,
        lastMessage: lastMsg?.content,
        lastMessageAt: lastMsg?.sent_at,
        lastMessageSender: lastMsg?.sender_type as SenderType,
        unreadCount: unreadCounts[rel.id] || 0,
        status: rel.status as CoachingStatus,
      };
    });
  },

  /**
   * Fetch messages for a specific conversation/relationship
   */
  async fetchMessages(
    relationshipId: string,
    options: { limit?: number; before?: string } = {}
  ): Promise<ChatMessage[]> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { limit = 50, before } = options;

    let query = supabase
      .from('chat_messages')
      .select('*')
      .eq('relationship_id', relationshipId)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('sent_at', before);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[messageService] Error fetching messages:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Get sender info
    const userSenderIds = data.filter(m => m.sender_type === 'user').map(m => m.sender_id);
    const expertSenderIds = data.filter(m => m.sender_type === 'expert').map(m => m.sender_id);

    const [profileMap, expertMap] = await Promise.all([
      fetchProfilesByIds([...new Set(userSenderIds)]),
      fetchExpertsByIds([...new Set(expertSenderIds)]),
    ]);

    // Transform and return in chronological order
    return data
      .map(row => {
        const isExpert = row.sender_type === 'expert';
        const senderData = isExpert ? expertMap[row.sender_id] : profileMap[row.sender_id];
        return transformMessage(row, {
          name: isExpert ? senderData?.name : (senderData?.full_name || senderData?.email?.split('@')[0]),
          avatar: isExpert ? senderData?.photo_url : senderData?.avatar_url,
        });
      })
      .reverse(); // Chronological order (oldest first)
  },

  /**
   * Send a new message
   */
  async sendMessage(
    relationshipId: string,
    senderId: string,
    senderType: SenderType,
    content: string,
    options: {
      messageType?: MessageType;
      attachmentUrl?: string;
      checkinId?: string;
    } = {}
  ): Promise<ChatMessage> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const { messageType = 'text', attachmentUrl, checkinId } = options;

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        relationship_id: relationshipId,
        sender_id: senderId,
        sender_type: senderType,
        content,
        message_type: messageType,
        attachment_url: attachmentUrl,
        checkin_id: checkinId,
        is_read: false,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[messageService] Error sending message:', error);
      throw error;
    }

    return transformMessage(data);
  },

  /**
   * Mark messages as read
   */
  async markAsRead(
    relationshipId: string,
    readerType: SenderType
  ): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    // Mark all messages from the OTHER party as read
    const senderTypeToMark = readerType === 'expert' ? 'user' : 'expert';

    const { error } = await supabase
      .from('chat_messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('relationship_id', relationshipId)
      .eq('sender_type', senderTypeToMark)
      .eq('is_read', false);

    if (error) {
      console.error('[messageService] Error marking messages as read:', error);
      throw error;
    }
  },

  /**
   * Get unread count for a specific relationship
   */
  async getUnreadCount(
    relationshipId: string,
    readerType: SenderType
  ): Promise<number> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    const senderTypeToCount = readerType === 'expert' ? 'user' : 'expert';

    const { count, error } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('relationship_id', relationshipId)
      .eq('sender_type', senderTypeToCount)
      .eq('is_read', false);

    if (error) {
      console.error('[messageService] Error getting unread count:', error);
      return 0;
    }

    return count || 0;
  },

  /**
   * Get unread counts for multiple relationships
   */
  async getUnreadCountsForRelationships(
    relationshipIds: string[],
    readerType: SenderType
  ): Promise<Record<string, number>> {
    if (!isSupabaseConfigured() || !supabase || relationshipIds.length === 0) {
      return {};
    }

    const senderTypeToCount = readerType === 'expert' ? 'user' : 'expert';

    const { data, error } = await supabase
      .from('chat_messages')
      .select('relationship_id')
      .in('relationship_id', relationshipIds)
      .eq('sender_type', senderTypeToCount)
      .eq('is_read', false);

    if (error) {
      console.error('[messageService] Error getting unread counts:', error);
      return {};
    }

    // Count per relationship
    const counts: Record<string, number> = {};
    (data || []).forEach(row => {
      counts[row.relationship_id] = (counts[row.relationship_id] || 0) + 1;
    });

    return counts;
  },

  /**
   * Get last message for each relationship
   */
  async getLastMessagesForRelationships(
    relationshipIds: string[]
  ): Promise<Record<string, { content: string; sent_at: string; sender_type: string }>> {
    if (!isSupabaseConfigured() || !supabase || relationshipIds.length === 0) {
      return {};
    }

    // Fetch the most recent message per relationship
    // Using a subquery approach
    const lastMessages: Record<string, { content: string; sent_at: string; sender_type: string }> = {};

    // For each relationship, get the last message
    await Promise.all(
      relationshipIds.map(async (relId) => {
        const { data } = await supabase
          .from('chat_messages')
          .select('content, sent_at, sender_type')
          .eq('relationship_id', relId)
          .order('sent_at', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          lastMessages[relId] = data;
        }
      })
    );

    return lastMessages;
  },

  /**
   * Get total unread count for a coach across all conversations
   */
  async getTotalUnreadCount(coachId: string): Promise<number> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    // Get all relationship IDs for this coach
    const { data: relationships, error: relError } = await supabase
      .from('coaching_relationships')
      .select('id')
      .eq('expert_id', coachId);

    if (relError || !relationships || relationships.length === 0) {
      return 0;
    }

    const relationshipIds = relationships.map(r => r.id);

    // Count unread messages from users (clients)
    const { count, error } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .in('relationship_id', relationshipIds)
      .eq('sender_type', 'user')
      .eq('is_read', false);

    if (error) {
      console.error('[messageService] Error getting total unread count:', error);
      return 0;
    }

    return count || 0;
  },

  /**
   * Subscribe to new messages for a relationship (real-time)
   */
  subscribeToMessages(
    relationshipId: string,
    onMessage: (message: ChatMessage) => void
  ): RealtimeChannel | null {
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('[messageService] Cannot subscribe - Supabase not configured');
      return null;
    }

    const channel = supabase
      .channel(`messages:${relationshipId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `relationship_id=eq.${relationshipId}`,
        },
        (payload) => {
          console.log('[messageService] New message received:', payload);
          const message = transformMessage(payload.new);
          onMessage(message);
        }
      )
      .subscribe();

    return channel;
  },

  /**
   * Subscribe to all conversations for a coach (for unread indicators)
   */
  subscribeToAllConversations(
    coachId: string,
    onUpdate: () => void
  ): RealtimeChannel | null {
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('[messageService] Cannot subscribe - Supabase not configured');
      return null;
    }

    // Subscribe to all chat_messages changes
    // We'll filter by relationship on the client side
    const channel = supabase
      .channel(`coach_messages:${coachId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
        },
        () => {
          // Trigger a refresh of conversation list
          onUpdate();
        }
      )
      .subscribe();

    return channel;
  },

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel: RealtimeChannel | null): void {
    if (channel && supabase) {
      supabase.removeChannel(channel);
    }
  },
};
