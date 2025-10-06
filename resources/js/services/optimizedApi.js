import axios from 'axios';

class OptimizedApiService {
  constructor() {
    this.pendingRequests = new Map();
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds default cache
  }

  /**
   * Get cache key for request
   */
  getCacheKey(url, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    
    return `${url}_${JSON.stringify(sortedParams)}`;
  }

  /**
   * Check if request is cached and still valid
   */
  isCached(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    
    const now = Date.now();
    return (now - cached.timestamp) < this.cacheTimeout;
  }

  /**
   * Get cached response
   */
  getCached(cacheKey) {
    const cached = this.cache.get(cacheKey);
    return cached ? cached.data : null;
  }

  /**
   * Set cache
   */
  setCache(cacheKey, data, timeout = null) {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    // Auto-cleanup after timeout
    if (timeout) {
      setTimeout(() => {
        this.cache.delete(cacheKey);
      }, timeout);
    }
  }

  /**
   * Clear cache for specific pattern
   */
  clearCache(pattern = null) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Make optimized API request with deduplication and caching
   */
  async request(method, url, data = null, options = {}) {
    const token = localStorage.getItem('token');
    const config = {
      method,
      url,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (data) {
      config.data = data;
    }

    // For GET requests, check cache first
    if (method.toLowerCase() === 'get') {
      const cacheKey = this.getCacheKey(url, data);
      
      if (this.isCached(cacheKey)) {
        console.log(`Cache hit for ${url}`);
        return this.getCached(cacheKey);
      }

      // Check if request is already pending
      if (this.pendingRequests.has(cacheKey)) {
        console.log(`Request deduplication for ${url}`);
        return this.pendingRequests.get(cacheKey);
      }

      // Create pending request promise
      const requestPromise = this.makeRequest(config, cacheKey);
      this.pendingRequests.set(cacheKey, requestPromise);

      try {
        const response = await requestPromise;
        return response;
      } finally {
        this.pendingRequests.delete(cacheKey);
      }
    }

    // For non-GET requests, make direct request and clear relevant caches
    const response = await this.makeRequest(config);
    
    // Clear related caches after mutations
    if (['post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
      this.clearRelatedCaches(url);
    }

    return response;
  }

  /**
   * Make actual HTTP request
   */
  async makeRequest(config, cacheKey = null) {
    try {
      const response = await axios(config);
      
      // Cache successful GET responses
      if (config.method.toLowerCase() === 'get' && cacheKey && response.status === 200) {
        this.setCache(cacheKey, response.data);
      }

      return response.data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Clear caches related to the request URL
   */
  clearRelatedCaches(url) {
    if (url.includes('/messages')) {
      this.clearCache('messages');
    } else if (url.includes('/notifications')) {
      this.clearCache('notifications');
    }
  }

  // Convenience methods
  async get(url, params = null) {
    return this.request('GET', url, params);
  }

  async post(url, data) {
    return this.request('POST', url, data);
  }

  async put(url, data) {
    return this.request('PUT', url, data);
  }

  async delete(url) {
    return this.request('DELETE', url);
  }

  // Specific API methods
  async getNotifications(params = {}) {
    return this.get('/api/notifications', params);
  }

  async getNotificationUnreadCount() {
    return this.get('/api/notifications/unread-count');
  }

  async getMessages(params = {}) {
    return this.get('/api/messages', params);
  }

  async getSentMessages(params = {}) {
    return this.get('/api/messages/sent', params);
  }

  async getMessageUnreadCount() {
    return this.get('/api/messages/unread-count');
  }

  async getConversations() {
    return this.get('/api/messages/conversations');
  }

  async getConversation(otherUserId) {
    return this.get(`/api/messages/conversation/${otherUserId}`);
  }

  async getAvailableCM() {
    return this.get('/api/messages/available-cm');
  }

  async sendMessage(recipientId, subject, content, type = 'general') {
    return this.post('/api/messages', {
      recipientID: recipientId,
      subject,
      content,
      type
    });
  }

  async markMessageAsRead(messageId) {
    return this.put(`/api/messages/${messageId}/read`);
  }

  async markAllMessagesAsRead() {
    return this.put('/api/messages/mark-all-read');
  }

  async deleteMessage(messageId) {
    return this.delete(`/api/messages/${messageId}`);
  }

  async clearAllMessages() {
    return this.delete('/api/messages/clear-all');
  }

  async markNotificationAsRead(notificationId) {
    return this.put(`/api/notifications/${notificationId}/read`);
  }

  async markAllNotificationsAsRead() {
    return this.put('/api/notifications/mark-all-read');
  }

  async deleteNotification(notificationId) {
    return this.delete(`/api/notifications/${notificationId}`);
  }
}

// Create singleton instance
const optimizedApi = new OptimizedApiService();

export default optimizedApi;
