import React, { useState, useEffect } from 'react';
import { Users, Circle } from 'lucide-react';
import { supabase, Profile } from '../lib/supabase';

interface OnlineUsersProps {
  currentUser: Profile;
  onUserClick?: (user: Profile) => void;
}

interface UserSession {
  user_id: string;
  last_activity: string;
  is_online: boolean;
  profiles: Profile;
}

export default function OnlineUsers({ currentUser, onUserClick }: OnlineUsersProps) {
  const [onlineUsers, setOnlineUsers] = useState<UserSession[]>([]);

  useEffect(() => {
    fetchOnlineUsers();
    updateUserSession();
    
    const interval = setInterval(() => {
      updateUserSession();
      fetchOnlineUsers();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [currentUser.id]);

  const updateUserSession = async () => {
    await supabase.rpc('update_user_session', {
      user_uuid: currentUser.id
    });
  };

  const fetchOnlineUsers = async () => {
    const { data } = await supabase
      .from('user_sessions')
      .select(`
        *,
        profiles:user_id (*)
      `)
      .neq('user_id', currentUser.id)
      .eq('is_online', true)
      .gte('last_activity', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Active in last 5 minutes

    if (data) {
      setOnlineUsers(data);
    }
  };

  if (onlineUsers.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <Users className="w-5 h-5 text-green-500" />
        <h3 className="font-semibold text-gray-900">Online Now</h3>
        <span className="text-sm text-gray-500">({onlineUsers.length})</span>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {onlineUsers.map((session) => (
          <button
            key={session.user_id}
            onClick={() => onUserClick?.(session.profiles)}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200 px-3 py-2 rounded-full transition-all group"
          >
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {session.profiles.username?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <Circle className="absolute -bottom-1 -right-1 w-3 h-3 text-green-500 fill-current" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
              {session.profiles.username}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}