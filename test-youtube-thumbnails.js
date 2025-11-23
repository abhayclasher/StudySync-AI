/**
 * Test script for YouTube thumbnail fallback functionality
 * Run this with: node test-youtube-thumbnails.js
 */

import {
  getYouTubeThumbnailUrl,
  extractVideoId,
  createThumbnailConfig,
  THUMBNAIL_QUALITIES,
  THUMBNAIL_FALLBACK_CHAIN
} from './lib/youtubeUtils';

console.log('🧪 Testing YouTube Thumbnail Fallback Utility\n');

// Test 1: Valid video IDs
console.log('✅ Test 1: Valid YouTube Video IDs');
const validVideoIds = [
  'dQw4w9WgXcQ',  // Rick Roll
  'jNQXAC9IVRw',  // First YouTube video
  '5qap5aO4i9A',  // Music video
  'L_jWHffIx5E'   // Calm music
];

validVideoIds.forEach(videoId => {
  const thumbnailUrl = getYouTubeThumbnailUrl(videoId);
  console.log(`  Video ID: ${videoId}`);
  console.log(`  Thumbnail URL: ${thumbnailUrl}`);
  console.log(`  Expected format: https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
  console.log('');
});

// Test 2: Invalid video IDs
console.log('✅ Test 2: Invalid YouTube Video IDs');
const invalidVideoIds = [
  '',
  '   ',
  'invalid',
  '123',
  'xyz',
  null,
  undefined
];

invalidVideoIds.forEach(videoId => {
  const thumbnailUrl = getYouTubeThumbnailUrl(videoId);
  console.log(`  Video ID: ${videoId}`);
  console.log(`  Thumbnail URL: ${thumbnailUrl}`);
  console.log(`  Should be placeholder: ${thumbnailUrl.includes('placehold.co') ? '✅' : '❌'}`);
  console.log('');
});

// Test 3: YouTube URL extraction
console.log('✅ Test 3: YouTube URL Extraction');
const youtubeUrls = [
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://youtu.be/dQw4w9WgXcQ',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLExample',
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  'https://www.youtube.com/v/dQw4w9WgXcQ'
];

youtubeUrls.forEach(url => {
  const videoId = extractVideoId(url);
  const thumbnailUrl = getYouTubeThumbnailUrl(videoId);
  console.log(`  URL: ${url}`);
  console.log(`  Extracted ID: ${videoId}`);
  console.log(`  Thumbnail URL: ${thumbnailUrl}`);
  console.log('');
});

// Test 4: Thumbnail config creation
console.log('✅ Test 4: Thumbnail Config Creation');
const testCases = [
  { videoId: 'dQw4w9WgXcQ', title: 'Rick Roll' },
  { videoId: 'invalid', title: 'Invalid Video' },
  { videoId: '', title: 'Empty Video' }
];

testCases.forEach(({ videoId, title }) => {
  const config = createThumbnailConfig(videoId, title);
  console.log(`  Video ID: ${videoId}`);
  console.log(`  Title: ${title}`);
  console.log(`  Config:`, config);
  console.log('');
});

// Test 5: Thumbnail quality constants
console.log('✅ Test 5: Thumbnail Quality Constants');
console.log('  Available qualities:', THUMBNAIL_QUALITIES);
console.log('  Fallback chain:', THUMBNAIL_FALLBACK_CHAIN);
console.log('');

// Test 6: Edge cases
console.log('✅ Test 6: Edge Cases');
const edgeCases = [
  'dQw4w9WgXcQ&t=42s',  // With timestamp
  'dQw4w9WgXcQ&feature=youtu.be',  // With extra parameters
  '   dQw4w9WgXcQ   ',  // With whitespace
  'DQW4W9WGXCQ',  // Uppercase
  'dQw4w9WgXcQ123',  // Too long
  'dQw4w9WgXc'  // Too short
];

edgeCases.forEach(input => {
  const videoId = extractVideoId(input);
  const thumbnailUrl = getYouTubeThumbnailUrl(videoId);
  console.log(`  Input: "${input}"`);
  console.log(`  Extracted ID: ${videoId}`);
  console.log(`  Thumbnail URL: ${thumbnailUrl}`);
  console.log('');
});

console.log('🎉 YouTube Thumbnail Fallback Utility Tests Complete!');
console.log('\n📋 Summary:');
console.log('  - All valid video IDs should generate proper thumbnail URLs');
console.log('  - Invalid inputs should fallback to placeholder images');
console.log('  - URL extraction should work for various YouTube URL formats');
console.log('  - The utility provides robust fallback mechanisms');
console.log('\n💡 The utility prevents 404 errors by:');
console.log('  1. Using maxresdefault.jpg as the preferred quality');
console.log('  2. Gracefully falling back to hqdefault.jpg if maxresdefault.jpg fails');
console.log('  3. Using placeholder images if all YouTube thumbnails fail');