import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { v4 as uuidv4 } from 'uuid';

/**
 * Offline Queue Manager
 * 
 * Manages API requests when offline and syncs when connection is restored
 */

const QUEUE_KEY = '@olympia_offline_queue';

class OfflineQueueManager {
    constructor() {
        this.isOnline = true;
        this.setupNetworkListener();
    }

    setupNetworkListener() {
        NetInfo.addEventListener(state => {
            const wasOffline = !this.isOnline;
            this.isOnline = state.isConnected;

            // If just came back online, process queue
            if (wasOffline && this.isOnline) {
                this.processQueue();
            }
        });
    }

    async addToQueue(request) {
        const queue = await this.getQueue();

        const queueItem = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            ...request
        };

        queue.push(queueItem);
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

        return queueItem.id;
    }

    async getQueue() {
        try {
            const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
            return queueJson ? JSON.parse(queueJson) : [];
        } catch (error) {
            console.error('Error getting queue:', error);
            return [];
        }
    }

    async processQueue() {
        const queue = await this.getQueue();

        if (queue.length === 0) {
            return;
        }

        console.log(`Processing ${queue.length} queued requests...`);

        const processed = [];
        const failed = [];

        for (const item of queue) {
            try {
                await this.executeRequest(item);
                processed.push(item.id);
            } catch (error) {
                console.error(`Failed to process ${item.id}:`, error);
                failed.push(item);
            }
        }

        // Remove processed items from queue
        const newQueue = queue.filter(item => !processed.includes(item.id));
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));

        console.log(`Processed ${processed.length} requests, ${failed.length} failed`);
    }

    async executeRequest(item) {
        const { endpoint, method, data, headers } = item;

        // Import API service dynamically to avoid circular dependency
        const api = require('./api').default;

        switch (method) {
            case 'POST':
                return await api.post(endpoint, data, { headers });
            case 'PUT':
                return await api.put(endpoint, data, { headers });
            case 'DELETE':
                return await api.delete(endpoint, { headers });
            default:
                throw new Error(`Unsupported method: ${method}`);
        }
    }

    async clearQueue() {
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([]));
    }

    async getQueueSize() {
        const queue = await this.getQueue();
        return queue.length;
    }
}

// Singleton instance
const offlineQueue = new OfflineQueueManager();

/**
 * Wrapper for API calls with offline support
 */
export const offlineApiCall = async (endpoint, method, data, headers = {}) => {
    const api = require('./api').default;

    try {
        // Try making the request
        const response = await api[method.toLowerCase()](endpoint, data, { headers });
        return response;
    } catch (error) {
        // If offline, add to queue
        if (error.message === 'Network Error' || !offlineQueue.isOnline) {
            console.log('Offline - Adding to queue:', endpoint);

            const queueId = await offlineQueue.addToQueue({
                endpoint,
                method,
                data,
                headers
            });

            // Return a mock success response
            return {
                data: {
                    success: true,
                    queued: true,
                    queueId,
                    message: 'Request queued for sync when online'
                }
            };
        }

        throw error;
    }
};

/**
 * Cache Manager for offline data access
 */
class CacheManager {
    static async cacheData(key, data, expiresIn = 3600000) { // 1 hour default
        const cacheItem = {
            data,
            timestamp: Date.now(),
            expiresIn
        };

        await AsyncStorage.setItem(`@cache_${key}`, JSON.stringify(cacheItem));
    }

    static async getCachedData(key) {
        try {
            const cacheJson = await AsyncStorage.getItem(`@cache_${key}`);

            if (!cacheJson) {
                return null;
            }

            const cacheItem = JSON.parse(cacheJson);
            const now = Date.now();

            // Check if expired
            if (now - cacheItem.timestamp > cacheItem.expiresIn) {
                await AsyncStorage.removeItem(`@cache_${key}`);
                return null;
            }

            return cacheItem.data;
        } catch (error) {
            console.error('Error getting cached data:', error);
            return null;
        }
    }

    static async clearCache() {
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(key => key.startsWith('@cache_'));
        await AsyncStorage.multiRemove(cacheKeys);
    }
}

/**
 * Enhanced API calls with caching
 */
export const cachedApiCall = async (key, apiCall, cacheTime = 3600000) => {
    // Try to get from cache first
    const cached = await CacheManager.getCachedData(key);

    if (cached) {
        console.log('Returning cached data for:', key);
        return { data: cached, fromCache: true };
    }

    try {
        // Make API call
        const response = await apiCall();

        // Cache the response
        await CacheManager.cacheData(key, response.data, cacheTime);

        return { ...response, fromCache: false };
    } catch (error) {
        // If offline and no cache, throw error
        throw error;
    }
};

export { offlineQueue, CacheManager };
export default offlineQueue;
