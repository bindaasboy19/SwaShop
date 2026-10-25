/**
 * Cloudinary AI Image Enhancement Provider
 * 
 * Applies non-destructive visual and lighting enhancements, background leveling,
 * and catalog-ready framing to seller product images.
 */

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary if credentials exist
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

export const enhanceCloudinaryImage = async (imageUrl, options = {}) => {
  if (!imageUrl) {
    throw new Error('Image URL is required for enhancement.');
  }

  // If it is already a Cloudinary image URL, we can generate real AI enhancement transformations non-destructively
  if (imageUrl.includes('res.cloudinary.com')) {
    // Transformations:
    // e_improve: Auto-optimizes color, contrast, and levels
    // e_auto_contrast: Corrects exposure and lighting flaws
    // e_sharpen:50: Subtly sharpens artisan textures (bamboo weave, embroidery, pottery glaze)
    // c_pad,b_white,w_800,h_800: Centers product on clean studio white canvas
    const transformationString = 'e_improve,e_auto_contrast,e_sharpen:50,c_pad,b_white,w_800,h_800';
    const enhancedUrl = imageUrl.replace('/upload/', `/upload/${transformationString}/`);

    return {
      original: imageUrl,
      enhanced: enhancedUrl,
      provider: 'cloudinary',
      enhancementsApplied: [
        'AI Lighting & Exposure Balance (e_improve)',
        'Auto-Contrast Optimization (e_auto_contrast)',
        'Artisan Craft Detail Sharpening (e_sharpen:50)',
        'Clean Studio White Backdrop Framing (c_pad,b_white)'
      ]
    };
  }

  // If it's a local/external image, upload to Cloudinary with eager transformations if configured
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
    try {
      const uploadResult = await cloudinary.uploader.upload(imageUrl, {
        folder: 'swashop/enhanced',
        transformation: [
          { effect: 'improve' },
          { effect: 'auto_contrast' },
          { width: 800, height: 800, crop: 'pad', background: 'white' }
        ]
      });

      return {
        original: imageUrl,
        enhanced: uploadResult.secure_url,
        provider: 'cloudinary',
        enhancementsApplied: [
          'Cloudinary AI Lighting Optimization',
          'Auto-Contrast Leveling',
          'Square Studio Canvas Framing'
        ]
      };
    } catch (err) {
      console.warn('[Cloudinary AI Enhance] Cloud upload failed, using local URL preservation:', err.message);
    }
  }

  // Graceful fallback
  return {
    original: imageUrl,
    enhanced: imageUrl,
    provider: 'local',
    enhancementsApplied: ['Original Image Preserved (Enhancement Fallback)']
  };
};
