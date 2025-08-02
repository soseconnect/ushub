import React, { useState, useEffect } from 'react';
import { Plus, MessageCircle, Users, LogOut, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { supabase, Post, isDemoMode, demoPosts } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard';
import ChatWindow from '../components/ChatWindow';
import NotificationCenter from '../components/NotificationCenter';
import OnlineUsers from '../components/OnlineUsers';
import { Profile } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function HomePage() {
  const { profile, signOut } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | undefined>();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      initializeData();
    }
  }, [profile]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online!');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const initializeData = async () => {
    setLoading(true);
    try {
      if (isDemoMode) {
        // Demo mode - use demo data
        setPosts(demoPosts);
        setUsers([]);
      } else {
        await Promise.all([
          fetchPosts(),
          fetchUsers()
        ]);
      }
    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', profile?.id);
      
      if (error) throw error;
      if (data) setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const openChatWithUser = (user: Profile) => {
    setSelectedUser(user);
    setShowChat(true);
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white text-2xl font-bold">YS</span>
          </div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">YS</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Your Space
              </h1>
              {isDemoMode && (
                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                  Demo
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreatePost(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-2 rounded-full hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
              >
                <Plus className="w-6 h-6" />
              </button>
              
              {!isDemoMode && <NotificationCenter currentUser={profile} />}
              
              <button
                onClick={() => setShowChat(true)}
                className="text-gray-600 hover:text-purple-600 p-2 transition-colors"
              >
                <MessageCircle className="w-6 h-6" />
              </button>
              
              <div className="flex items-center space-x-2">
                {isOnline ? (
                  <Wifi className="w-5 h-5 text-green-500" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-500" />
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {profile.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <button
                  onClick={signOut}
                  className="text-gray-600 hover:text-red-500 p-2 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Demo Mode Notice */}
        {isDemoMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-800">Demo Mode Active</h3>
                <p className="text-sm text-blue-700">
                  Connect to Supabase to enable real-time features, image uploads, and messaging.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {profile.username}!
          </h2>
          <p className="text-gray-600">
            Share your moments with the people who matter most
          </p>
        </div>

        {/* Online Users */}
        {!isDemoMode && <OnlineUsers currentUser={profile} onUserClick={openChatWithUser} />}

        {/* All Users List */}
        {users.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Users className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">All Friends</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => openChatWithUser(user)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-blue-100 hover:from-purple-200 hover:to-blue-200 px-4 py-2 rounded-full transition-all"
                >
                  <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {user.username?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user.username}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Posts */}
        <div className="space-y-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">YS</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No posts yet
              </h3>
              <p className="text-gray-500 mb-6">
                Be the first to share a moment!
              </p>
              <button
                onClick={() => setShowCreatePost(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Create Your First Post
              </button>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={profile}
                onPostUpdate={fetchPosts}
              />
            ))
          )}
        </div>
      </main>

      {/* Modals */}
      <CreatePost
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        currentUser={profile}
        onPostCreated={initializeData}
      />

      <ChatWindow
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        currentUser={profile}
        selectedUser={selectedUser}
      />
    </div>
  );
}