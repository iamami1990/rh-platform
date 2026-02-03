import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from './styles/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';

// Screens
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import AttendanceHistoryScreen from './screens/AttendanceHistoryScreen';
import LeaveRequestScreen from './screens/LeaveRequestScreen';
import LeaveHistoryScreen from './screens/LeaveHistoryScreen';
import PayrollScreen from './screens/PayrollScreen';
import ProfileScreen from './screens/ProfileScreen';
import CheckInCameraScreen from './screens/CheckInCameraScreen';
import CheckOutScreen from './screens/CheckOutScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tabs Navigator
const MainTabs = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Home') {
                        iconName = 'home';
                    } else if (route.name === 'Attendance') {
                        iconName = 'access-time';
                    } else if (route.name === 'Leaves') {
                        iconName = 'event';
                    } else if (route.name === 'Payroll') {
                        iconName = 'receipt';
                    } else if (route.name === 'Profile') {
                        iconName = 'person';
                    }

                    return <MaterialIcons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: Colors.surface,
                    borderTopColor: Colors.divider,
                },
                headerShown: false,
            })}
        >
            <Tab.Screen
                name="Home"
                component={DashboardScreen}
                options={{ tabBarLabel: 'Accueil' }}
            />
            <Tab.Screen
                name="Attendance"
                component={AttendanceHistoryScreen}
                options={{ tabBarLabel: 'Pointages' }}
            />
            <Tab.Screen
                name="Leaves"
                component={LeaveHistoryScreen}
                options={{ tabBarLabel: 'Congés' }}
            />
            <Tab.Screen
                name="Payroll"
                component={PayrollScreen}
                options={{ tabBarLabel: 'Paie' }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ tabBarLabel: 'Profil' }}
            />
        </Tab.Navigator>
    );
};

// App Navigator
const AppNavigator = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerStyle: {
                        backgroundColor: Colors.primary,
                    },
                    headerTintColor: Colors.surface,
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                }}
            >
                {!isAuthenticated ? (
                    <Stack.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{ headerShown: false }}
                    />
                ) : (
                    <>
                        <Stack.Screen
                            name="Main"
                            component={MainTabs}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="LeaveRequest"
                            component={LeaveRequestScreen}
                            options={{ title: 'Demande de Congé' }}
                        />
                        <Stack.Screen
                            name="CheckInCamera"
                            component={CheckInCameraScreen}
                            options={{ title: 'Check-in', headerShown: false }}
                        />
                        <Stack.Screen
                            name="CheckOut"
                            component={CheckOutScreen}
                            options={{ headerShown: false }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

// Main App Component
const App = () => {
    return (
        <AuthProvider>
            <AppNavigator />
        </AuthProvider>
    );
};

export default App;
