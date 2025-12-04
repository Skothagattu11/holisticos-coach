/**
 * ChatWindow Component
 * Displays the message thread for a conversation (like Instagram DM chat)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { messageService } from '@/lib/services/messageService';
import { useAuth } from '@/contexts/AuthContext';
import type { ChatMessage, Conversation } from '@/types';
import { Send, ArrowLeft, MoreVertical, Image, Paperclip, Check, CheckCheck } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

interface ChatWindowProps {
  conversation: Conversation | null;
  onBack?: () => void;
  className?: string;
}

export function ChatWindow({ conversation, onBack, className }: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadMessages = useCallback(async () => {
    if (!conversation?.id) return;

    try {
      setLoading(true);
      const data = await messageService.fetchMessages(conversation.id);
      setMessages(data);

      // Mark messages as read
      await messageService.markAsRead(conversation.id, 'expert');
    } catch (err) {
      console.error('[ChatWindow] Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  }, [conversation?.id]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!conversation?.id) return;

    const channel = messageService.subscribeToMessages(conversation.id, (newMsg) => {
      // Add message only if it doesn't already exist (prevent duplicates)
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === newMsg.id);
        if (exists) {
          console.log('[ChatWindow] Duplicate message filtered:', newMsg.id);
          return prev;
        }
        return [...prev, newMsg];
      });

      // Mark as read if from client
      if (newMsg.senderType === 'user') {
        messageService.markAsRead(conversation.id, 'expert');
      }
    });

    return () => {
      if (channel) {
        messageService.unsubscribe(channel);
      }
    };
  }, [conversation?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when conversation changes
  useEffect(() => {
    if (conversation && inputRef.current) {
      inputRef.current.focus();
    }
  }, [conversation]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation?.id || !user?.id || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const sentMessage = await messageService.sendMessage(
        conversation.id,
        user.id,
        'expert',
        content
      );

      // Add to local state (in case real-time doesn't fire immediately)
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === sentMessage.id);
        if (exists) return prev;
        return [...prev, sentMessage];
      });
    } catch (err) {
      console.error('[ChatWindow] Error sending message:', err);
      // Restore message if failed
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format message time
  const formatMessageTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'h:mm a');
    } catch {
      return '';
    }
  };

  // Format date separator
  const formatDateSeparator = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isToday(date)) return 'Today';
      if (isYesterday(date)) return 'Yesterday';
      return format(date, 'MMMM d, yyyy');
    } catch {
      return '';
    }
  };

  // Group messages by date
  const groupMessagesByDate = (msgs: ChatMessage[]) => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = '';

    msgs.forEach((msg) => {
      const msgDate = format(new Date(msg.sentAt), 'yyyy-MM-dd');
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msg.sentAt, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  };

  // Empty state
  if (!conversation) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full bg-muted/30', className)}>
        <div className="text-center p-8">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Send className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">Your Messages</h3>
          <p className="text-sm text-muted-foreground">
            Select a conversation to start messaging
          </p>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <Avatar className="h-10 w-10">
          <AvatarImage src={conversation.clientAvatar} alt={conversation.clientName} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {getInitials(conversation.clientName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{conversation.clientName}</h3>
          <p className="text-xs text-muted-foreground capitalize">{conversation.status.replace('_', ' ')}</p>
        </div>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={cn('flex gap-2', i % 2 === 0 ? '' : 'justify-end')}>
                {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full" />}
                <Skeleton className={cn('h-12 rounded-2xl', i % 2 === 0 ? 'w-48' : 'w-32')} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Send a message to start the conversation</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messageGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                {/* Date separator */}
                <div className="flex items-center justify-center my-4">
                  <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {formatDateSeparator(group.date)}
                  </span>
                </div>

                {/* Messages in group */}
                <div className="space-y-2">
                  {group.messages.map((msg, msgIndex) => {
                    const isCoach = msg.senderType === 'expert';
                    const showAvatar =
                      !isCoach &&
                      (msgIndex === 0 ||
                        group.messages[msgIndex - 1]?.senderType !== msg.senderType);

                    return (
                      <div
                        key={msg.id}
                        className={cn('flex gap-2', isCoach ? 'justify-end' : '')}
                      >
                        {/* Client avatar */}
                        {!isCoach && (
                          <div className="w-8 flex-shrink-0">
                            {showAvatar && (
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={conversation.clientAvatar}
                                  alt={conversation.clientName}
                                />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {getInitials(conversation.clientName)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        )}

                        {/* Message bubble */}
                        <div
                          className={cn(
                            'max-w-[70%] rounded-2xl px-4 py-2',
                            isCoach
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-muted rounded-bl-md'
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          <div
                            className={cn(
                              'flex items-center gap-1 mt-1',
                              isCoach ? 'justify-end' : ''
                            )}
                          >
                            <span
                              className={cn(
                                'text-[10px]',
                                isCoach ? 'text-primary-foreground/70' : 'text-muted-foreground'
                              )}
                            >
                              {formatMessageTime(msg.sentAt)}
                            </span>
                            {isCoach && (
                              <span className="text-primary-foreground/70">
                                {msg.isRead ? (
                                  <CheckCheck className="h-3 w-3" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <Image className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Input
            ref={inputRef}
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={sending}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
