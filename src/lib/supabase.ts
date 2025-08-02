import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Check if we have valid Supabase credentials
const hasValidCredentials = supabaseUrl !== 'https://placeholder.supabase.co' && 
                           supabaseAnonKey !== 'placeholder-key' &&
                           supabaseUrl.includes('supabase.co');

if (!hasValidCredentials) {
  console.warn('⚠️ Supabase not configured. Using demo mode.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Database types
export interface Profile {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  is_admin: boolean;
  last_seen?: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  created_at: string;
  profiles: Profile;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: Profile;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
  sender: Profile;
  receiver: Profile;
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

// Demo data for when Supabase is not configured
export const demoUser = {
  id: 'demo-user-1',
  email: 'demo@example.com',
  username: 'DemoUser',
  created_at: new Date().toISOString(),
  is_admin: false
};

export const demoPosts: Post[] = [
  {
    id: 'demo-post-1',
    user_id: 'demo-user-1',
    content: '🎉 Welcome to Your Private Space! This is a demo post to show how the app works.',
    image_url: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    profiles: demoUser
  },
  {
    id: 'demo-post-2',
    user_id: 'demo-user-1',
    content: 'Beautiful sunset today! 🌅',
    image_url: 'https://images.pexels.com/photos/416978/pexels-photo-416978.jpeg?auto=compress&cs=tinysrgb&w=800',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    profiles: demoUser
  }
];

// Check if we're in demo mode
export const isDemoMode = !hasValidCredentials;

// Demo mode helpers
export const demoAuth = {
  signIn: async () => ({ data: { user: demoUser }, error: null }),
  signUp: async () => ({ data: { user: demoUser }, error: null }),
  signOut: async () => ({ error: null }),
  getSession: async () => ({ data: { session: { user: demoUser } }, error: null })
};