import React, { useState } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MainDashboard from '../screens/MainDashBoard';
import MobileApp from '../screens/MobileApp';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => setIsAuthenticated(true);
  const handleLogout = () => setIsAuthenticated(false);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login">
              {props => <LoginScreen {...props} onLogin={handleLogin} />}
            </Stack.Screen>
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : isMobile ? (
          <Stack.Screen name="Mobile">
            {props => <MobileApp {...props} onLogout={handleLogout} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Desktop">
            {props => <MainDashboard {...props} onLogout={handleLogout} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}