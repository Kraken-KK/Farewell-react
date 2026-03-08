/**
 * YouTube Data API v3 Service
 * For song search and retrieval
 */

// YouTube API Key - provided for farewell event
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || 'AIzaSyDg-QBfQO42Rv9GHbGCuZJ6zQiZcS37aMI';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Search for songs/videos on YouTube
 * @param {string} query - Search query
 * @param {number} maxResults - Maximum results to return (default 10)
 * @returns {Promise<Array>} - Array of video results
 */
export const searchSongs = async (query, maxResults = 10) => {
    if (!YOUTUBE_API_KEY) {
        console.warn('YouTube API key not configured');
        return { success: false, error: 'YouTube API key not configured. Please add VITE_YOUTUBE_API_KEY to your environment.' };
    }

    try {
        const params = new URLSearchParams({
            part: 'snippet',
            q: `${query} song music`,
            type: 'video',
            videoCategoryId: '10', // Music category
            maxResults: maxResults.toString(),
            key: YOUTUBE_API_KEY
        });

        const response = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to search YouTube');
        }

        const data = await response.json();

        const videos = data.items.map(item => ({
            youtubeId: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            description: item.snippet.description
        }));

        return { success: true, videos };
    } catch (error) {
        console.error('YouTube search error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get video details by ID
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object>} - Video details
 */
export const getVideoDetails = async (videoId) => {
    if (!YOUTUBE_API_KEY) {
        return { success: false, error: 'YouTube API key not configured' };
    }

    try {
        const params = new URLSearchParams({
            part: 'snippet,statistics',
            id: videoId,
            key: YOUTUBE_API_KEY
        });

        const response = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to get video details');
        }

        const data = await response.json();

        if (data.items.length === 0) {
            return { success: false, error: 'Video not found' };
        }

        const video = data.items[0];
        return {
            success: true,
            video: {
                youtubeId: video.id,
                title: video.snippet.title,
                thumbnail: video.snippet.thumbnails.medium?.url,
                channelTitle: video.snippet.channelTitle,
                viewCount: video.statistics.viewCount,
                likeCount: video.statistics.likeCount
            }
        };
    } catch (error) {
        console.error('YouTube video details error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Check if API key is configured
 */
export const isApiKeyConfigured = () => !!YOUTUBE_API_KEY;

/**
 * Get YouTube video embed URL
 * @param {string} videoId - YouTube video ID
 * @returns {string} - Embed URL
 */
export const getEmbedUrl = (videoId) => `https://www.youtube.com/embed/${videoId}`;

/**
 * Get YouTube video watch URL
 * @param {string} videoId - YouTube video ID
 * @returns {string} - Watch URL
 */
export const getWatchUrl = (videoId) => `https://www.youtube.com/watch?v=${videoId}`;
