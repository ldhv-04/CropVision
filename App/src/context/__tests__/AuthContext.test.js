import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

describe.skip('AuthContext', () => {
  it('should throw an error when useAuth is used outside of AuthProvider', () => {
    // Suppress console.error for expected error boundary error
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth phai duoc su dung ben trong AuthProvider.');
    
    spy.mockRestore();
  });

  it('should provide default null values', () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('should update state when login is called', () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login({ user: { id: 1, name: 'Test' }, token: 'abc' });
    });

    expect(result.current.user).toEqual({ id: 1, name: 'Test' });
    expect(result.current.token).toBe('abc');
  });

  it('should clear state when logout is called', () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      // Login first
      result.current.login({ user: { id: 1 }, token: 'abc' });
    });

    // Then logout
    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });
});
