import React, { useState } from 'react';
import { UploadCloud, X, Loader2, Image as ImageIcon } from 'lucide-react';
import axiosClient from '../../api/axiosClient.js';
import { useToast } from '../../context/ToastContext.jsx';

const ImageUploadDropzone = ({ images = [], onImagesChange, maxImages = 5 }) => {
  const [isUploading, setIsUploading] = useState(false);
  const { showToast } = useToast();

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      showToast(`You can upload a maximum of ${maxImages} images.`, 'error');
      return;
    }

    setIsUploading(true);
    const newUrls = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // File size validation (5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast(`'${file.name}' exceeds the 5MB file size limit.`, 'error');
        continue;
      }

      const formData = new FormData();
      formData.append('image', file);

      try {
        const res = await axiosClient.post('/products/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.success && res.url) {
          newUrls.push(res.url);
        }
      } catch (err) {
        showToast(`Failed to upload '${file.name}': ${err.message}`, 'error');
      }
    }

    if (newUrls.length > 0) {
      onImagesChange([...images, ...newUrls]);
      showToast(`Successfully uploaded ${newUrls.length} image(s).`, 'success');
    }
    setIsUploading(false);
  };

  const handleRemoveImage = (indexToRemove) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onImagesChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Upload Drop Area */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFileUpload(e.dataTransfer.files);
        }}
        className="relative border-2 border-dashed border-slate-300 hover:border-brand-500 bg-slate-50/60 hover:bg-brand-50/20 rounded-2xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center group"
      >
        <input
          type="file"
          accept="image/png, image/jpeg, image/webp"
          multiple
          disabled={isUploading}
          onChange={(e) => handleFileUpload(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-brand-100 text-slate-500 group-hover:text-brand-600 flex items-center justify-center mb-3 transition">
          {isUploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          ) : (
            <UploadCloud className="w-6 h-6" />
          )}
        </div>

        <p className="text-sm font-semibold text-slate-800">
          {isUploading ? 'Uploading images...' : 'Click or drag images to upload'}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          PNG, JPG, or WEBP up to 5MB each ({images.length}/{maxImages} uploaded)
        </p>
      </div>

      {/* Previews Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {images.map((url, idx) => (
            <div
              key={idx}
              className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-100 shadow-xs"
            >
              <img
                src={url}
                alt={`Upload preview ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(idx)}
                className="absolute top-1.5 right-1.5 p-1 bg-slate-900/70 hover:bg-rose-600 text-white rounded-full opacity-90 group-hover:opacity-100 transition shadow-xs"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {idx === 0 && (
                <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-slate-900/70 text-white rounded-md text-[10px] font-bold">
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploadDropzone;
