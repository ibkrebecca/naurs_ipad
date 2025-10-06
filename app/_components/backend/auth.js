"use client";

import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth } from "@/app/_components/backend/config";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

const formatAuthUser = (user) => ({ uid: user.uid, email: user.email });

const useBackendAuth = () => {
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const authStateChanged = async (authState) => {
    if (!authState) {
      setLoading(false);
      return;
    }
    setLoading(true);
    var formattedUser = formatAuthUser(authState);
    setAuthUser(formattedUser);
    setLoading(false);
  };

  const clear = () => {
    setAuthUser(null);
    setLoading(true);
  };

  const signin = async (e, p) => await signInWithEmailAndPassword(auth, e, p);

  const signup = async (e, p) => {
    await createUserWithEmailAndPassword(auth, e, p);
  };

  const logout = async () => {
    await signOut(auth).then(clear);
    Cookies.remove("NaursIpadSignedIn");
    toast.dark("User logged out.");
    if (typeof window !== "undefined") window.location = "/";
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, authStateChanged);
    return () => unsubscribe();
  }, []);

  return { authUser, loading, signin, signup, logout };
};

export default useBackendAuth;
