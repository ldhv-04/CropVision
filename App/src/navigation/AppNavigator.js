import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { AuthProvider, useAuth } from '../context/AuthContext';

import WelcomeScreen from '../screens/Welcome';
import LoginScreen from '../screens/Login';
import RegisterScreen from '../screens/Register';
import VerifyEmailScreen from '../screens/VerifyEmail';
import MainDashboard from '../screens/MainDashBoard';

const Stack = createStackNavigator();

// Bo dieu huong noi bo su dung AuthContext de quyet dinh man hinh nao hien thi.
function RootNavigator() {
  const { token } = useAuth();
  const isAuthenticated = Boolean(token);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        </>
      ) : (
        <Stack.Screen name="Main" component={MainDashboard} />
      )}
    </Stack.Navigator>
  );
}

// Cay navigation chinh — duoc bao boc boi AuthProvider de RootNavigator truy cap duoc context.
export default function AppNavigator() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}