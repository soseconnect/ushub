/*
  # Create database functions for user sessions and notifications

  1. Functions
    - `update_user_session`: Updates or creates user session
    - `handle_new_like`: Creates notification when post is liked
    - `handle_new_comment`: Creates notification when post is commented
    - `handle_new_message`: Creates notification when message is sent

  2. Security
    - Functions are accessible to authenticated users
*/

-- Function to update user session
CREATE OR REPLACE FUNCTION update_user_session(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_sessions (user_id, last_activity, is_online)
  VALUES (user_uuid, NOW(), true)
  ON CONFLICT (user_id)
  DO UPDATE SET
    last_activity = NOW(),
    is_online = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new likes
CREATE OR REPLACE FUNCTION handle_new_like()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  liker_username TEXT;
BEGIN
  -- Get the post owner and liker username
  SELECT p.user_id, pr.username INTO post_owner_id, liker_username
  FROM posts p
  JOIN profiles pr ON pr.id = NEW.user_id
  WHERE p.id = NEW.post_id;

  -- Don't notify if user likes their own post
  IF post_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      post_owner_id,
      'like',
      'New Like',
      liker_username || ' liked your post',
      json_build_object('post_id', NEW.post_id, 'liker_id', NEW.user_id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new comments
CREATE OR REPLACE FUNCTION handle_new_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  commenter_username TEXT;
BEGIN
  -- Get the post owner and commenter username
  SELECT p.user_id, pr.username INTO post_owner_id, commenter_username
  FROM posts p
  JOIN profiles pr ON pr.id = NEW.user_id
  WHERE p.id = NEW.post_id;

  -- Don't notify if user comments on their own post
  IF post_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      post_owner_id,
      'comment',
      'New Comment',
      commenter_username || ' commented on your post',
      json_build_object('post_id', NEW.post_id, 'comment_id', NEW.id, 'commenter_id', NEW.user_id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new messages
CREATE OR REPLACE FUNCTION handle_new_message()
RETURNS TRIGGER AS $$
DECLARE
  sender_username TEXT;
BEGIN
  -- Get sender username
  SELECT username INTO sender_username
  FROM profiles
  WHERE id = NEW.sender_id;

  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    NEW.receiver_id,
    'message',
    'New Message',
    'You have a new message from ' || sender_username,
    json_build_object('message_id', NEW.id, 'sender_id', NEW.sender_id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;