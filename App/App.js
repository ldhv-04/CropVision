import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';

import WelcomeScreen from './src/screens/Welcome';
import LoginScreen from './src/screens/Login';
import RegisterScreen from './src/screens/Register';
import VerifyEmailScreen from './src/screens/VerifyEmail';
import MainDashboard from './src/screens/MainDashBoard';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [routeParams, setRouteParams] = useState({});
  const [authSession, setAuthSession] = useState(null);

  const navigateTo = (screenName, params = {}) => {
    setRouteParams(params);
    setCurrentScreen(screenName);
  };

  // Luu token va user sau dang nhap de app phan quyen va goi API theo session.
  const handleLoginSuccess = (session) => {
    setAuthSession(session);
    setCurrentScreen('main');
  };

  const handleLogout = () => {
    setAuthSession(null);
    setCurrentScreen('welcome');
    setRouteParams({});
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen onNavigate={navigateTo} />;
      case 'login':
        return <LoginScreen onNavigate={navigateTo} onLoginSuccess={handleLoginSuccess} />;
      case 'register':
        return <RegisterScreen onNavigate={navigateTo} />;
      case 'verifyEmail':
        return <VerifyEmailScreen onNavigate={navigateTo} routeParams={routeParams} />;
      case 'main':
        return <MainDashboard onLogout={handleLogout} currentUser={authSession?.user} authToken={authSession?.token} />;
      default:
        return <WelcomeScreen onNavigate={navigateTo} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      {renderScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
});
