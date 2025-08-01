import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Send, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase, Post, Comment, Profile } from '../lib/supabase';
import toast from 'react-hot-toast';

interface PostCardProps {
  post: Post;
  currentUser: Profile;
  onDelete?: (postId: string) => void;
}

export default function PostCard({ post, currentUser, onDelete }: PostCardProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
    checkLikeStatus();
  }, [post.id]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (*)
      `)
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });
    
    if (data) setComments(data);
  };

  const checkLikeStatus = async () => {
    const { data } = await supabase
      .from('likes')
      .select('*')
      .eq('post_id', post.id);
    
    if (data) {
      setLikeCount(data.length);
      setLiked(data.some(like => like.user_id === currentUser.id));
    }
  };

  const handleLike = async () => {
    if (liked) {
      await supabase
        .from('likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', currentUser.id);
      setLiked(false);
      setLikeCount(prev => prev - 1);
    } else {
      await supabase
        .from('likes')
        .insert({ post_id: post.id, user_id: currentUser.id });
      setLiked(true);
      setLikeCount(prev => prev + 1);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    const { error } = await supabase
      .from('comments')
      .insert({
        post_id: post.id,
        user_id: currentUser.id,
        content: newComment.trim(),
      });

    if (error) {
      toast.error('Failed to add comment');
    } else {
      setNewComment('');
      fetchComments();
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">
              {post.profiles.username?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{post.profiles.username}</h3>
            <p className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        {(currentUser.id === post.user_id || currentUser.is_admin) && (
          <button className="text-gray-400 hover:text-gray-600 p-2">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="relative">
          <img
            src={post.image_url}
            alt="Post"
            className="w-full h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
          />
        </div>
      )}

      {/* Content */}
      {post.content && (
        <div className="p-4">
          <p className="text-gray-800">{post.content}</p>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 ${
                liked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
              } transition-colors`}
            >
              <Heart className={`w-6 h-6 ${liked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{likeCount}</span>
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="w-6 h-6" />
              <span className="text-sm font-medium">{comments.length}</span>
            </button>
          </div>
        </div>

        {/* Add Comment */}
        <form onSubmit={handleComment} className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-semibold">
              {currentUser.username?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <input
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={loading || !newComment.trim()}
            className="p-2 text-purple-600 hover:text-purple-700 disabled:opacity-50 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        {/* Comments */}
        {showComments && comments.length > 0 && (
          <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">
                    {comment.profiles.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-2xl px-4 py-2">
                    <p className="font-semibold text-sm text-gray-900">
                      {comment.profiles.username}
                    </p>
                    <p className="text-gray-800">{comment.content}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-4">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}