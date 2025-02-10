import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Search, Send, Paperclip, MoreVertical, User, Image, Smile, ChevronLeft } from 'lucide-react';

interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  isOwn?: boolean;
  avatar?: string;
}

const Messages = () => {
  const { t } = useTranslation();
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);

  const conversations: Message[] = [
    {
      id: 1,
      sender: "John Doe",
      content: "Hi, is this item still available?",
      timestamp: "10:30 AM",
      isRead: false,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=48&h=48&q=80"
    },
    {
      id: 2,
      sender: "Alice Smith",
      content: "Thanks for the quick response!",
      timestamp: "Yesterday",
      isRead: true,
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=48&h=48&q=80"
    },
    {
      id: 3,
      sender: "Mike Johnson",
      content: "What's the best price you can offer?",
      timestamp: "Yesterday",
      isRead: true,
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=48&h=48&q=80"
    }
  ];

  const messages = [
    {
      id: 1,
      content: "Hi, is this item still available?",
      timestamp: "10:30 AM",
      isOwn: false
    },
    {
      id: 2,
      content: "Yes, it's still available! Are you interested in purchasing?",
      timestamp: "10:32 AM",
      isOwn: true
    },
    {
      id: 3,
      content: "Great! What's the best price you can offer?",
      timestamp: "10:33 AM",
      isOwn: false
    },
    {
      id: 4,
      content: "I can offer a 10% discount if you buy today.",
      timestamp: "10:35 AM",
      isOwn: true
    }
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      // TODO: Implement send message logic
      setNewMessage('');
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.sender.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConversation = conversations.find(conv => conv.id === selectedChat);

  const handleBackToList = () => {
    setSelectedChat(null);
    setShowMobileChat(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 h-[calc(100vh-12rem)]">
          {/* Conversations List */}
          <div 
            className={`border-r border-gray-200 ${
              showMobileChat ? 'hidden md:block' : 'block'
            }`}
          >
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('common.messages')}
              </h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('common.searchMessages')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="overflow-y-auto h-[calc(100%-5rem)]">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => {
                    setSelectedChat(conv.id);
                    setShowMobileChat(true);
                  }}
                  className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedChat === conv.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {conv.avatar ? (
                        <img
                          src={conv.avatar}
                          alt={conv.sender}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {conv.sender}
                        </h3>
                        <span className="text-xs text-gray-500">{conv.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{conv.content}</p>
                    </div>
                    {!conv.isRead && (
                      <div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div 
            className={`col-span-2 flex flex-col ${
              !showMobileChat ? 'hidden md:flex' : 'flex'
            }`}
          >
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center">
                    <button
                      onClick={handleBackToList}
                      className="md:hidden mr-2 p-2 hover:bg-gray-100 rounded-full"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center space-x-3">
                      {selectedConversation?.avatar ? (
                        <img
                          src={selectedConversation.avatar}
                          alt={selectedConversation.sender}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {selectedConversation?.sender}
                        </h3>
                        <p className="text-xs text-green-500">{t('common.online')}</p>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-full">
                    <MoreVertical className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          message.isOwn
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                        <span
                          className={`text-xs mt-1 block ${
                            message.isOwn ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
                          {message.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <button
                      type="button"
                      className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-full hidden sm:block"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-full hidden sm:block"
                    >
                      <Image className="w-5 h-5" />
                    </button>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={t('common.typeMessage')}
                        className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-full focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-2 text-gray-500 hover:text-gray-600"
                      >
                        <Smile className="w-5 h-5" />
                      </button>
                    </div>
                    <button
                      type="submit"
                      className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!newMessage.trim()}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {t('common.noMessageSelected')}
                  </h3>
                  <p className="text-gray-500">
                    {t('common.selectConversation')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;