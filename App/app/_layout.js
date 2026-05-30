// Polyfill to prevent Hermes/React Native RangeError on fetch connection/CORS errors (status 0)
if (typeof global.Response !== 'undefined') {
  const OriginalResponse = global.Response;
  const SafeResponse = function(body, init) {
    if (init && init.status === 0) {
      init = { ...init, status: 503 };
    }
    return new OriginalResponse(body, init);
  };
  for (const prop of Object.getOwnPropertyNames(OriginalResponse)) {
    if (prop !== 'prototype' && prop !== 'name' && prop !== 'length') {
      try {
        Object.defineProperty(SafeResponse, prop, Object.getOwnPropertyDescriptor(OriginalResponse, prop));
      } catch (e) {}
    }
  }
  SafeResponse.prototype = OriginalResponse.prototype;
  global.Response = SafeResponse;
}

import 'expo-dev-client';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useAuthStore } from '../src/modules/@core/auth/useAuthStore';

export default function RootLayout() {
  const rehydrate = useAuthStore((s) => s.rehydrate);

  useEffect(() => {
    rehydrate();
  }, []);

  return (
    <>
      <StatusBar style="light" backgroundColor="#0f172a" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
