import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Profile, supabase, isDemoMode } from '../lib/supabase';
import toast from 'react-hot-toast';

interface CreatePostProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Profile;
  onPostCreated: () => void;
}

export default function CreatePost({ isOpen, onClose, currentUser, onPostCreated }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedImage(file);
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  if (!isOpen) return null;

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      // Fallback to a placeholder image service
      return `https://picsum.photos/800/600?random=${Math.random()}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedImage) {
      toast.error('Please add some content or an image');
      return;
    }

    setLoading(true);
    try {
      let imageUrl: string | null = null;

      if (selectedImage) {
        if (isDemoMode) {
          // In demo mode, use a placeholder image
          imageUrl = `https://picsum.photos/800/600?random=${Math.random()}`;
          toast.success('Image uploaded (demo mode)');
        } else {
          imageUrl = await uploadImage(selectedImage);
        }
      }

      if (isDemoMode) {
        // Demo mode - simulate post creation
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Post created successfully! (Demo mode)');
      } else {
        const { error } = await supabase
          .from('posts')
          .insert({
            user_id: currentUser.id,
            content: content.trim(),
            image_url: imageUrl,
          });

        if (error) throw error;
        toast.success('Post created successfully!');
      }

      setContent('');
      setSelectedImage(null);
      setPreviewUrl(null);
      onPostCreated();
      onClose();
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error(error.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create Post</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {isDemoMode && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <p className="text-sm text-amber-700">
                  Demo mode: Images will use placeholders
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {currentUser.username?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <textarea
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 border-none resize-none focus:ring-0 text-lg placeholder-gray-500 min-h-[100px]"
                rows={4}
              />
            </div>

            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300 hover:border-purple-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {isDragActive
                    ? 'Drop the image here...'
                    : 'Drag & drop an image, or click to select'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
              <button
                type="button"
                {...getRootProps()}
                className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors"
              >
                <input {...getInputProps()} />
                <ImageIcon className="w-5 h-5" />
                <span>Add Photo</span>
              </button>

              <button
                type="submit"
                disabled={loading || (!content.trim() && !selectedImage)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Posting...</span>
                  </div>
                ) : (
                  'Share'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}