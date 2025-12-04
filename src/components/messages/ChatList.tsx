/**
 * ChatList Component
 * Displays a list of conversations (like Instagram DM list)
 */

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { messageService } from '@/lib/services/messageService';
import { useAuth } from '@/contexts/AuthContext';
import type { Conversation } from '@/types';
import { Search, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChatListProps {
  selectedConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  className?: string;
}

export function ChatList({
  selectedConversationId,
  onSelectConversation,
  className,
}: ChatListProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadConversations = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await messageService.fetchConversations(user.id);
      setConversations(data);
      setError(null);
    } catch (err) {
      console.error('[ChatList] Error loading conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = messageService.subscribeToAllConversations(user.id, () => {
      // Refresh conversations when any message changes
      loadConversations();
    });

    return () => {
      if (channel) {
        messageService.unsubscribe(channel);
      }
    };
  }, [user?.id, loadConversations]);

  // Filter conversations by search query
  const filteredConversations = conversations.filter((conv) =>
    conv.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format time for display
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return '';
    }
  };

  // Truncate message for preview
  const truncateMessage = (message?: string, maxLength = 40) => {
    if (!message) return 'No messages yet';
    if (message.length <= maxLength) return message;
    return message.slice(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className={cn('flex flex-col h-full', className)}>
        <div className="p-4 border-b">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full p-4', className)}>
        <p className="text-destructive text-sm">{error}</p>
        <button
          onClick={loadConversations}
          className="mt-2 text-sm text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-3">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv)}
                className={cn(
                  'w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors',
                  selectedConversationId === conv.id && 'bg-muted'
                )}
              >
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conv.clientAvatar} alt={conv.clientName} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(conv.clientName)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online indicator could go here */}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium truncate">{conv.clientName}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p
                      className={cn(
                        'text-sm truncate',
                        conv.unreadCount > 0
                          ? 'text-foreground font-medium'
                          : 'text-muted-foreground'
                      )}
                    >
                      {conv.lastMessageSender === 'expert' && 'You: '}
                      {truncateMessage(conv.lastMessage)}
                    </p>
                    {conv.unreadCount > 0 && (
                      <Badge
                        variant="default"
                        className="ml-2 h-5 min-w-[20px] flex items-center justify-center rounded-full px-1.5 text-xs"
                      >
                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
