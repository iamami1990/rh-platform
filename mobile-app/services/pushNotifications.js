// Push Notifications Service (Placeholder)

const configurePushNotifications = () => {
    console.log('Push notifications are currently disabled.');
};

const getFCMToken = async () => {
    console.log('getFCMToken: No token available.');
    return null;
};

const subscribeToTopic = (topic) => {
    console.log(`subscribeToTopic: ${topic} (Simulated)`);
};

export {
    configurePushNotifications,
    getFCMToken,
    subscribeToTopic
};
