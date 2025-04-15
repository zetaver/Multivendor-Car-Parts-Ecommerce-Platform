import { API_URL } from "../config";

// Simple utility function for merging class names
export function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Formats an image URL to ensure it's properly displayed
 * @param imageUrl The image URL to format
 * @param placeholderSize The size of the placeholder image (default: 64)
 * @returns A properly formatted image URL
 */
export function formatImageUrl(imageUrl: string | undefined | null, placeholderSize: number = 64): string {
  // If the URL is null, undefined, or empty, return a placeholder image
  if (!imageUrl || imageUrl.trim() === '') {
    return `https://via.placeholder.com/${placeholderSize}`;
  }
  
  // Check if the URL already includes http:// or https://
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If it's a relative path starting with /api/media, add the base URL
  if (imageUrl.startsWith('/api/media/')) {
    return `${API_URL}${imageUrl}`;
  }
  
  // For just filenames, assume they're in the media directory
  return `${API_URL}/api/media/${imageUrl}`;
}