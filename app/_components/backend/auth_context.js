"use client";

import { createContext, useContext } from "react";
import useBackendAuth from "@/app/_components/backend/auth";

const AuthContext = createContext({
  authUser: null,
  loading: true,
  signin: async () => {},
  signup: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const auth = useBackendAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
