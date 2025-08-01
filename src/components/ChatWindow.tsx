import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase, Message, Profile } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Profile;
  selectedUser?: Profile;
}

export default function ChatWindow({ isOpen, onClose, currentUser, selectedUser }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && selectedUser) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [isOpen, selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!selectedUser) return;

    const { data } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id (*),
        receiver:receiver_id (*)
      `)
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id})`)
      .order('created_at', { ascending: true });

    if (data) setMessages(data);
  };

  const subscribeToMessages = () => {
    if (!selectedUser) return;

    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `or(and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id}))`
      }, (payload) => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    setLoading(true);
    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: currentUser.id,
        receiver_id: selectedUser.id,
        content: newMessage.trim(),
        read: false,
      });

    if (error) {
      toast.error('Failed to send message');
    } else {
      setNewMessage('');
      fetchMessages();
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {selectedUser ? `Chat with ${selectedUser.username}` : 'Messages'}
              </h2>
              <p className="text-sm text-gray-500">
                {selectedUser ? 'Send messages instantly' : 'Select a user to chat'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {selectedUser ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_id === currentUser.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      message.sender_id === currentUser.id
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender_id === currentUser.id ? 'text-purple-100' : 'text-gray-500'
                    }`}>
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Send Message */}
            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
                <button
                  type="submit"
                  disabled={loading || !newMessage.trim()}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-2 rounded-full hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a user to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}