import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Upload,
  Camera,
  RotateCcw,
  Check,
  Sparkles,
  CloudUpload,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';

interface ProfilePhotoModalProps {
  onClose: () => void;
}

export const ProfilePhotoModal: React.FC<ProfilePhotoModalProps> = ({ onClose }) => {
  const { currentUser, updateProfilePhoto } = useApp();

  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'presets'>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera tracks cleanly
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Start webcam
  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 640 },
          facingMode: 'user',
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(
        err?.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access in your browser settings.'
          : 'Could not access camera. Please make sure no other app is using your webcam, or try uploading a file.'
      );
      setIsCameraActive(false);
    }
  };

  // Capture snapshot from webcam
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setSelectedImage(dataUrl);
    setSelectedFile(null);
    stopCamera();
  };

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, WEBP).');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle Preset select
  const PRESET_AVATARS = [
    {
      label: 'Photojournalist Lead',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    },
    {
      label: 'Cinematographer & Colorist',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    },
    {
      label: 'Broadcast Technician',
      url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    },
    {
      label: 'Digital Illustrator',
      url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    },
    {
      label: 'Creative Director',
      url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    },
    {
      label: 'Sports Photographer',
      url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    },
  ];

  // Save to Firebase Storage
  const handleSavePhoto = async () => {
    if (!selectedImage && !selectedFile) return;
    setIsUploading(true);
    setUploadStatus('Uploading to Firebase Storage...');

    try {
      const source = selectedFile || selectedImage!;
      await updateProfilePhoto(source);
      setIsUploading(false);
      onClose();
    } catch (err: any) {
      console.error('Upload error:', err);
      setIsUploading(false);
      setUploadStatus('');
    }
  };

  // Lifecycle for camera tab
  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTab]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Update Profile Photo</h2>
              <p className="text-xs text-slate-400">
                Upload or capture a photo saved directly to Firebase Storage
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="p-3 bg-slate-950/50 border-b border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('upload');
              setSelectedImage(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
              activeTab === 'upload'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Photo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('camera');
              setSelectedImage(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
              activeTab === 'camera'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera Capture</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('presets');
              setSelectedImage(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
              activeTab === 'presets'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Presets</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: FILE UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {!selectedImage ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-amber-500/50 rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer bg-slate-950/40 hover:bg-slate-950/70 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-105 transition-transform">
                    <CloudUpload className="w-7 h-7" />
                  </div>
                  <div className="text-sm font-bold text-white mb-1">
                    Click to browse or drop photo here
                  </div>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Supports high-resolution JPG, PNG, WEBP. Files are automatically compressed & stored in Firebase Storage.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col items-center">
                    <div className="relative w-40 h-40 rounded-3xl overflow-hidden border-2 border-amber-500/50 shadow-2xl bg-slate-950">
                      <img
                        src={selectedImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-xs text-slate-400 mt-2">
                      New Profile Photo Preview
                    </div>
                  </div>

                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-700"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Choose Different Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setSelectedFile(null);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 text-xs font-semibold transition-colors cursor-pointer border border-rose-900/50"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CAMERA CAPTURE */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              {cameraError ? (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>Camera Unavailable</span>
                  </div>
                  <p>{cameraError}</p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="mt-2 py-1.5 px-3 rounded-lg bg-rose-900/60 hover:bg-rose-800/80 text-white font-semibold cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              ) : selectedImage ? (
                /* Captured Frame Preview */
                <div className="space-y-4">
                  <div className="flex flex-col items-center">
                    <div className="relative w-44 h-44 rounded-3xl overflow-hidden border-2 border-amber-500/60 shadow-2xl bg-slate-950">
                      <img
                        src={selectedImage}
                        alt="Captured"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-xs text-slate-300 font-semibold mt-2">
                      Photo Captured! Ready to save.
                    </div>
                  </div>

                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        startCamera();
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-700"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retake Photo</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Live Viewfinder */
                <div className="space-y-3">
                  <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-3xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-black flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />

                    {/* Circular framing guide overlay */}
                    <div className="absolute inset-4 rounded-full border-2 border-dashed border-amber-400/40 pointer-events-none" />

                    {!isCameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-slate-400 text-xs gap-2">
                        <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                        <span>Starting camera feed...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      disabled={!isCameraActive}
                      className="py-3 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Take Photo</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Choose an official First Peek Creatives member avatar preset:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PRESET_AVATARS.map((preset) => {
                  const isSelected = selectedImage === preset.url;
                  return (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => {
                        setSelectedImage(preset.url);
                        setSelectedFile(null);
                      }}
                      className={`p-2 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/40'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-16 h-16 rounded-2xl object-cover"
                      />
                      <span className="text-[11px] font-semibold text-slate-300 truncate w-full">
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upload Status / Storage indicator */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
            <CloudUpload className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">
              Target: <code className="text-amber-300/90 font-mono text-[11px]">decent-student-xlxdt.firebasestorage.app</code>
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSavePhoto}
            disabled={!selectedImage && !selectedFile || isUploading}
            className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-40 flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Storing in Firebase...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save to Profile</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
