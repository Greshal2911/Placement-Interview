"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  register: (email: string, name: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user storage (in-memory database)
const mockUsers = new Map<string, { email: string; name: string; password: string }>();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const register = async (email: string, name: string, password: string) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check if user already exists
    if (mockUsers.has(email.toLowerCase())) {
      throw new Error("User already exists with this email");
    }

    // Check if email is already in localStorage (from previous sessions)
    const existingUsers = JSON.parse(localStorage.getItem("mockUsers") || "{}");
    if (existingUsers[email.toLowerCase()]) {
      throw new Error("User already exists with this email");
    }

    // Create new user
    const userId = `user_${Date.now()}`;
    const newUser = { email, name, password };
    
    // Store in mock storage
    mockUsers.set(email.toLowerCase(), newUser);
    existingUsers[email.toLowerCase()] = newUser;
    localStorage.setItem("mockUsers", JSON.stringify(existingUsers));

    // Set user in context
    const userData: User = { id: userId, email, name, token: "mock-token" };
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const login = async (email: string, password: string) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check mock storage
    let found = mockUsers.get(email.toLowerCase());
    
    // Fall back to localStorage
    if (!found) {
      const existingUsers = JSON.parse(localStorage.getItem("mockUsers") || "{}");
      found = existingUsers[email.toLowerCase()];
    }

    if (!found) {
      throw new Error("User not found");
    }

    if (found.password !== password) {
      throw new Error("Invalid credentials");
    }

    // Set user in context
    const userData: User = {
      id: `user_${email}`,
      email: found.email,
      name: found.name,
      token: "mock-token",
    };
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
