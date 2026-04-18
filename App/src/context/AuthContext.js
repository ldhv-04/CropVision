import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

// Cung cap trang thai dang nhap cho toan bo cay component.
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);

  const login = (newSession) => setSession(newSession);

  const logout = () => setSession(null);

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, token: session?.token ?? null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook tien ich de lay context auth trong bat ky component nao.
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phai duoc su dung ben trong AuthProvider.');
  }
  return context;
}
