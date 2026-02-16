import axios from 'axios';

const API_URL = 'http://localhost:3001/api';
const BASE_URL = 'http://localhost:3001'; // Base URL for static assets

// Helper function to get full image URL
const getImageUrl = (relativePath) => {
  if (!relativePath) return null;
  // Check if it's already a full URL (e.g., from Cloudinary or another external source)
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  // Otherwise, prepend the base URL for local uploads
  return `${BASE_URL}${relativePath}`;
};

// Helper function for authenticated requests
const request = async (method, url, data = null, isFormData = false) => {
  const token = localStorage.getItem('token');
  const headers = {};

  if (token) {
    headers['x-auth-token'] = token;
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await axios({
      method,
      url: `${API_URL}${url}`,
      headers,
            data: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.msg) {
      throw new Error(error.response.data.msg);
    }
    throw new Error(error.message || 'Something went wrong');
  }
};

const api = {
  getMediaUrl: getImageUrl,
  login: async (credentials) => request('POST', '/auth/login', credentials),

  register: async (userData) => request('POST', '/auth/register', userData),

  getPosts: async () => request('GET', '/posts/timeline'), // Updated to get timeline posts
  getPost: async (postId) => request('GET', `/posts/${postId}`),

  getProfile: async (username) => request('GET', `/users/${username}`),

  updateProfile: async (userId, formData) => request('PUT', `/users/${userId}`, formData, true),

  // Post related APIs
  createPost: async (formData) => request('POST', '/posts', formData, true),
  updatePost: async (postId, caption) => request('PUT', `/posts/${postId}`, { caption }),
  deletePost: async (postId) => request('DELETE', `/posts/${postId}`),
  deleteMedia: async (postId, mediaId) => request('DELETE', `/posts/${postId}/media/${mediaId}`),
  getPostComments: async (postId) => request('GET', `/posts/${postId}/comments`),
  addComment: async (postId, content) => request('POST', `/posts/${postId}/comment`, { content }),
  updateComment: async (postId, commentId, content) => request('PUT', `/posts/${postId}/comments/${commentId}`, { content }),
  deleteComment: async (postId, commentId) => request('DELETE', `/posts/${postId}/comments/${commentId}`),
  likePost: async (postId) => request('POST', `/posts/${postId}/like`),
  unlikePost: async (postId) => request('DELETE', `/posts/${postId}/like`),
  checkLikeStatus: async (postId) => request('GET', `/posts/${postId}/like`),

  // Follow/Unfollow related APIs
  checkFollowStatus: async (followeeId, followerId) => request('GET', `/users/${followeeId}/followers/${followerId}/status`),
  followUser: async (followeeId) => request('POST', `/users/${followeeId}/follow`, {}),
  unfollowUser: async (followeeId) => request('POST', `/users/${followeeId}/unfollow`, {}),
  getFollowers: async (userId) => request('GET', `/users/${userId}/followers`),
  getFollowing: async (userId) => request('GET', `/users/${userId}/following`),

  // Follow request management
  getFollowRequests: async (userId) => request('GET', `/users/${userId}/follow-requests`),
  acceptFollowRequest: async (userId, followerId) => request('PUT', `/users/${userId}/followers/${followerId}/accept`),
  rejectFollowRequest: async (userId, followerId) => request('PUT', `/users/${userId}/followers/${followerId}/reject`),

  // Follower management
  removeFollower: async (userId, followerId) => request('DELETE', `/users/${userId}/followers/${followerId}`),

  // Blocking related APIs
  checkBlockStatus: async (blockerId, blockedId) => request('GET', `/users/${blockerId}/blocks/${blockedId}/status`),
  blockUser: async (blockedId) => request('POST', `/users/${blockedId}/block`, {}),
  unblockUser: async (blockedId) => request('DELETE', `/users/${blockedId}/unblock`),
  getBlockedUsers: async (userId) => request('GET', `/users/${userId}/blocked`),

  // User search API
  searchUsers: async (query) => request('GET', `/users/search?query=${query}`),
};

export { getImageUrl };
export default api;
