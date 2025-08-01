import React from 'react';
import { Heart } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <Heart className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-pulse" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Your Space</h2>
        <p className="text-gray-600">Please wait while we prepare everything for you...</p>
      </div>
    </div>
  );
}