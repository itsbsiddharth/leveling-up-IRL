import React, { useState, useRef } from 'react';
import { Upload, Check, X, File, FileAudio } from 'lucide-react';
import { useMusicPlayer } from '@/context/MusicContext';

const MusicUploader: React.FC<{
  color?: string;
}> = ({ color = '#7122e0' }) => {
  const { addUserTrack } = useMusicPlayer();
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file change (from file input)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };
  
  // Handle drag events
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  // Handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };
  
  // Process the uploaded file
  const processFile = (file: File) => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    
    // Check if it's an audio file
    if (!file.type.startsWith('audio/')) {
      setError('Please upload an audio file (MP3, WAV, etc.)');
      setIsProcessing(false);
      return;
    }
    
    // Check file size (limit to 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setError('File is too large. Maximum size is 20MB.');
      setIsProcessing(false);
      return;
    }
    
    try {
      addUserTrack(file);
      setSuccess(`Added "${file.name}" to your playlist!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError('Failed to process audio file. Please try again.');
      console.error('Error processing file:', err);
    }
    
    setIsProcessing(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="w-full">
      {/* Drag & Drop Area */}
      <div
        className={`relative border-2 border-dashed rounded-md p-6 text-center transition-all duration-200 ${
          dragActive 
            ? 'border-opacity-100 bg-opacity-10' 
            : 'border-opacity-40 bg-opacity-5'
        }`}
        style={{
          borderColor: color,
          backgroundColor: dragActive ? `${color}20` : 'transparent',
          boxShadow: dragActive ? `0 0 15px ${color}40` : 'none'
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="audio/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center justify-center">
          {isProcessing ? (
            <div className="animate-pulse">
              <FileAudio size={40} style={{ color }} className="mb-2" />
              <p className="text-sm text-gray-300">Processing audio...</p>
            </div>
          ) : error ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-500 bg-opacity-20 mb-2">
                <X size={20} className="text-red-500" />
              </div>
              <p className="text-sm text-red-400">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="mt-2 text-xs text-gray-400 hover:text-white transition-colors"
              >
                Try again
              </button>
            </div>
          ) : success ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-500 bg-opacity-20 mb-2">
                <Check size={20} className="text-green-500" />
              </div>
              <p className="text-sm text-green-400">{success}</p>
            </div>
          ) : (
            <>
              <Upload
                size={40}
                style={{ color }}
                className="mb-2"
              />
              <p className="text-sm font-medium mb-1" style={{ color }}>
                Upload your own music
              </p>
              <p className="text-xs text-gray-400">
                Drag and drop or click to select an audio file
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supports MP3, WAV, OGG (max 20MB)
              </p>
            </>
          )}
        </div>
      </div>
      
      {/* Animated indicator for drag mode */}
      {dragActive && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 border-2 rounded-md animate-pulse" 
            style={{ 
              borderColor: color,
              boxShadow: `0 0 20px ${color}40`
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-center px-4 py-3 rounded-lg" style={{ backgroundColor: `${color}30` }}>
              <FileAudio size={30} style={{ color }} className="mx-auto mb-2" />
              <p className="text-sm font-medium" style={{ color }}>Drop to add to playlist</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicUploader; 