import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Plus, MessageCircle, Users, LogOut, Heart, User, Wifi, WifiOff } from 'lucide-react';
import { supabase, Profile, Post } from './lib/supabase';
import AuthModal from './components/AuthModal';
import CreatePost from './components/CreatePost';
import PostCard from './components/PostCard';
import ChatWindow from './components/ChatWindow';
import NotificationCenter from './components/NotificationCenter';
import OnlineUsers from './components/OnlineUsers';
import toast from 'react-hot-toast';

function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | undefined>();
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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

  useEffect(() => {
    if (profile) {
      fetchPosts();
      fetchUsers();
    }
  }, [profile]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      await fetchProfile(session.user.id);
    }
    setLoading(false);
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) setProfile(data);
  };

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (*)
      `)
      .order('created_at', { ascending: false });
    
    if (data) setPosts(data);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', profile?.id);
    
    if (data) setUsers(data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
  };

  const openChatWithUser = (user: Profile) => {
    setSelectedUser(user);
    setShowChat(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <Heart className="w-20 h-20 text-purple-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Your Private Space
            </h1>
            <p className="text-xl text-gray-600">
              Share memories with your loved ones
            </p>
          </div>
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
          >
            Get Started
          </button>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
        <Toaster position="top-right" />
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
              <Heart className="w-8 h-8 text-purple-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Your Space
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreatePost(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-2 rounded-full hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
              >
                <Plus className="w-6 h-6" />
              </button>
              
              <NotificationCenter currentUser={profile} />
              
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
                  onClick={handleSignOut}
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
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {profile.username}!
          </h2>
          <p className="text-gray-600">
            Share your moments with the people who matter most
          </p>
        </div>

        {/* Online Users */}
        <OnlineUsers currentUser={profile} onUserClick={openChatWithUser} />

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
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
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
        onPostCreated={fetchPosts}
      />

      <ChatWindow
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        currentUser={profile}
        selectedUser={selectedUser}
      />

      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#333',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          },
        }}
      />
    </div>
  );
}

export default App;