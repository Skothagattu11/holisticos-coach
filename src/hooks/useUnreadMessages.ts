/**
 * Hook to track unread message count for the current coach
 */

import { useState, useEffect, useCallback } from 'react';
import { messageService } from '@/lib/services/messageService';
import { useAuth } from '@/contexts/AuthContext';

export function useUnreadMessages() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const count = await messageService.getTotalUnreadCount(user.id);
      setUnreadCount(count);
    } catch (err) {
      console.error('[useUnreadMessages] Error fetching unread count:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = messageService.subscribeToAllConversations(user.id, () => {
      // Refresh count when any message changes
      fetchUnreadCount();
    });

    return () => {
      if (channel) {
        messageService.unsubscribe(channel);
      }
    };
  }, [user?.id, fetchUnreadCount]);

  return { unreadCount, loading, refetch: fetchUnreadCount };
}
