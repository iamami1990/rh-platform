import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Push Notification Service
 * 
 * Handles Firebase Cloud Messaging (FCM) for push notifications
 */

class PushNotificationService {
    constructor() {
        this.fcmToken = null;
    }

    /**
     * Request notification permissions
     */
    async requestPermission() {
        try {
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                console.log('✅ Notification permission granted');
                return true;
            } else {
                console.log('❌ Notification permission denied');
                return false;
            }
        } catch (error) {
            console.error('Permission request error:', error);
            return false;
        }
    }

    /**
     * Get FCM token
     */
    async getFCMToken() {
        try {
            const token = await messaging().getToken();
            this.fcmToken = token;

            // Save token locally
            await AsyncStorage.setItem('@fcm_token', token);

            console.log('FCM Token:', token);
            return token;
        } catch (error) {
            console.error('Error getting FCM token:', error);
            return null;
        }
    }

    /**
     * Send FCM token to backend
     */
    async registerTokenWithBackend(userId) {
        if (!this.fcmToken) {
            await this.getFCMToken();
        }

        try {
            const api = require('./api').default;
            await api.post('/notifications/register-device', {
                user_id: userId,
                fcm_token: this.fcmToken,
                platform: Platform.OS,
                device_info: {
                    os: Platform.OS,
                    version: Platform.Version
                }
            });

            console.log('✅ Device registered for notifications');
        } catch (error) {
            console.error('Error registering device:', error);
        }
    }

    /**
     * Setup notification listeners
     */
    setupNotificationListeners(onNotificationReceived) {
        // Foreground messages
        const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
            console.log('📱 Foreground notification:', remoteMessage);

            if (onNotificationReceived) {
                onNotificationReceived(remoteMessage);
            }
        });

        // Background/Quit messages - notification tap
        messaging().onNotificationOpenedApp(remoteMessage => {
            console.log('📱 Notification opened app:', remoteMessage);

            // Navigate to appropriate screen based on notification data
            this.handleNotificationNavigation(remoteMessage);
        });

        // App opened from quit state
        messaging()
            .getInitialNotification()
            .then(remoteMessage => {
                if (remoteMessage) {
                    console.log('📱 App opened from notification:', remoteMessage);
                    this.handleNotificationNavigation(remoteMessage);
                }
            });

        // Token refresh
        messaging().onTokenRefresh(token => {
            console.log('📱 FCM token refreshed:', token);
            this.fcmToken = token;
            AsyncStorage.setItem('@fcm_token', token);
            // TODO: Update token in backend
        });

        return () => {
            unsubscribeForeground();
        };
    }

    /**
     * Handle notification navigation
     */
    handleNotificationNavigation(remoteMessage) {
        const { data } = remoteMessage;

        // TODO: Implement navigation logic based on notification type
        switch (data?.type) {
            case 'payroll_generated':
                // Navigate to payroll screen
                console.log('Navigate to payroll');
                break;
            case 'leave_approved':
            case 'leave_rejected':
                // Navigate to leaves screen
                console.log('Navigate to leaves');
                break;
            case 'sentiment_alert':
                // Navigate to dashboard
                console.log('Navigate to dashboard');
                break;
            default:
                console.log('Unknown notification type');
        }
    }

    /**
     * Subscribe to topic
     */
    async subscribeToTopic(topic) {
        try {
            await messaging().subscribeToTopic(topic);
            console.log(`✅ Subscribed to topic: ${topic}`);
        } catch (error) {
            console.error('Error subscribing to topic:', error);
        }
    }

    /**
     * Unsubscribe from topic
     */
    async unsubscribeFromTopic(topic) {
        try {
            await messaging().unsubscribeFromTopic(topic);
            console.log(`✅ Unsubscribed from topic: ${topic}`);
        } catch (error) {
            console.error('Error unsubscribing from topic:', error);
        }
    }

    /**
     * Display local notification
     */
    async displayLocalNotification(title, body, data = {}) {
        // For local notifications, you might want to use react-native-push-notification
        // or @notifee/react-native for more control

        console.log('Local notification:', { title, body, data });

        // TODO: Implement with notifee or similar library
        // await notifee.displayNotification({
        //   title,
        //   body,
        //   data,
        //   android: {
        //     channelId: 'default',
        //   },
        // });
    }

    /**
     * Initialize push notifications
     */
    async initialize(userId, onNotificationReceived) {
        // 1. Request permission
        const hasPermission = await this.requestPermission();

        if (!hasPermission) {
            console.log('⚠️  Notifications disabled by user');
            return false;
        }

        // 2. Get FCM token
        await this.getFCMToken();

        // 3. Register with backend
        await this.registerTokenWithBackend(userId);

        // 4. Setup listeners
        this.setupNotificationListeners(onNotificationReceived);

        // 5. Subscribe to relevant topics
        await this.subscribeToTopic('all_employees');
        await this.subscribeToTopic(`employee_${userId}`);

        console.log('✅ Push notifications initialized');
        return true;
    }

    /**
     * Cleanup on logout
     */
    async cleanup(userId) {
        await this.unsubscribeFromTopic('all_employees');
        await this.unsubscribeFromTopic(`employee_${userId}`);

        // TODO: Unregister device from backend
        const api = require('./api').default;
        try {
            await api.post('/notifications/unregister-device', {
                fcm_token: this.fcmToken
            });
        } catch (error) {
            console.error('Error unregistering device:', error);
        }
    }
}

// Singleton instance
const pushNotifications = new PushNotificationService();

export default pushNotifications;
