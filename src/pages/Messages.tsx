/**
 * Messages Page
 * Instagram-like chat interface for coach-client messaging
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChatList, ChatWindow } from '@/components/messages';
import type { Conversation } from '@/types';

const Messages = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowMobileChat(true);
  };

  const handleBack = () => {
    setShowMobileChat(false);
  };

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="flex h-full rounded-lg border bg-card overflow-hidden">
        {/* Conversation List - Hidden on mobile when chat is open */}
        <div
          className={cn(
            'w-full md:w-80 lg:w-96 border-r flex-shrink-0',
            showMobileChat ? 'hidden md:block' : 'block'
          )}
        >
          <ChatList
            selectedConversationId={selectedConversation?.id}
            onSelectConversation={handleSelectConversation}
            className="h-full"
          />
        </div>

        {/* Chat Window */}
        <div
          className={cn(
            'flex-1 min-w-0',
            !showMobileChat ? 'hidden md:block' : 'block'
          )}
        >
          <ChatWindow
            conversation={selectedConversation}
            onBack={handleBack}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
};

export default Messages;
