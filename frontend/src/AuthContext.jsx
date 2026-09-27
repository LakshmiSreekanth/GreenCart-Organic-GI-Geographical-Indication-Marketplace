import React, { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [farmer, setFarmer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  async function refreshMe() {
    if (!getToken()) {
      setUser(null);
      setFarmer(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api("/api/auth/me");
      setUser(data.user);
      setFarmer(data.farmer);
      if (data.user.role === "customer") {
        const cart = await api("/api/cart");
        setCartCount(cart.items.reduce((s, i) => s + i.quantity, 0));
      }
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshMe();
  }, []);

  function loginSuccess(token, nextUser) {
    setToken(token);
    setUser(nextUser);
  }

  function logout() {
    setToken(null);
    setUser(null);
    setFarmer(null);
    setCartCount(0);
  }

  return (
    <AuthContext.Provider
      value={{ user, farmer, loading, cartCount, setCartCount, loginSuccess, logout, refreshMe }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
