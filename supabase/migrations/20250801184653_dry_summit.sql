/*
  # Complete Social Media Platform Schema

  1. New Tables
    - `profiles` - User profiles with authentication data
    - `posts` - User posts with images and content
    - `comments` - Comments on posts
    - `likes` - Post likes tracking
    - `messages` - Direct messages between users
    - `notifications` - Real-time notifications system
    - `user_sessions` - Track online users

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Secure file uploads in storage

  3. Real-time Features
    - Notifications for likes, comments, messages
    - Online status tracking
    - Live updates for all interactions
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  avatar_url text,
  bio text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  is_admin boolean DEFAULT false,
  last_seen timestamptz DEFAULT now()
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text DEFAULT '',
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  read boolean DEFAULT false
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('like', 'comment', 'message', 'follow')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create user_sessions table for online status
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  last_activity timestamptz DEFAULT now(),
  is_online boolean DEFAULT true,
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Posts policies
CREATE POLICY "Users can read all posts"
  ON posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Users can read all comments"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Users can read all likes"
  ON likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own likes"
  ON likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can read own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Notifications policies
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- User sessions policies
CREATE POLICY "Users can read all sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own session"
  ON user_sessions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'images');

CREATE POLICY "Users can view images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'images');

CREATE POLICY "Users can update own images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Functions for notifications
CREATE OR REPLACE FUNCTION create_notification(
  target_user_id uuid,
  notification_type text,
  notification_title text,
  notification_message text,
  notification_data jsonb DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (target_user_id, notification_type, notification_title, notification_message, notification_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger functions for real-time notifications
CREATE OR REPLACE FUNCTION handle_new_like()
RETURNS trigger AS $$
DECLARE
  post_owner_id uuid;
  liker_username text;
BEGIN
  -- Get post owner and liker info
  SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
  SELECT username INTO liker_username FROM profiles WHERE id = NEW.user_id;
  
  -- Don't notify if user likes their own post
  IF post_owner_id != NEW.user_id THEN
    PERFORM create_notification(
      post_owner_id,
      'like',
      'New Like',
      liker_username || ' liked your post',
      json_build_object('post_id', NEW.post_id, 'liker_id', NEW.user_id)::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION handle_new_comment()
RETURNS trigger AS $$
DECLARE
  post_owner_id uuid;
  commenter_username text;
BEGIN
  -- Get post owner and commenter info
  SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
  SELECT username INTO commenter_username FROM profiles WHERE id = NEW.user_id;
  
  -- Don't notify if user comments on their own post
  IF post_owner_id != NEW.user_id THEN
    PERFORM create_notification(
      post_owner_id,
      'comment',
      'New Comment',
      commenter_username || ' commented on your post',
      json_build_object('post_id', NEW.post_id, 'comment_id', NEW.id, 'commenter_id', NEW.user_id)::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION handle_new_message()
RETURNS trigger AS $$
DECLARE
  sender_username text;
BEGIN
  -- Get sender info
  SELECT username INTO sender_username FROM profiles WHERE id = NEW.sender_id;
  
  PERFORM create_notification(
    NEW.receiver_id,
    'message',
    'New Message',
    'You have a new message from ' || sender_username,
    json_build_object('message_id', NEW.id, 'sender_id', NEW.sender_id)::jsonb
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS on_like_created ON likes;
CREATE TRIGGER on_like_created
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION handle_new_like();

DROP TRIGGER IF EXISTS on_comment_created ON comments;
CREATE TRIGGER on_comment_created
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION handle_new_comment();

DROP TRIGGER IF EXISTS on_message_created ON messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION handle_new_message();

-- Function to update user session
CREATE OR REPLACE FUNCTION update_user_session(user_uuid uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO user_sessions (user_id, last_activity, is_online)
  VALUES (user_uuid, now(), true)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    last_activity = now(),
    is_online = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;