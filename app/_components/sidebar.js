"use client";

import { useState, useEffect } from "react";
import logo from "@/public/logos/logo.png";
import { Logout, StatusUp } from "iconsax-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/app/_components/backend/auth_context";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/app/_components/backend/config";
import { usePathname } from "next/navigation";
import { toast } from "react-toastify";

const Siderbar = () => {
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  const { authUser, logout } = useAuth();

  useEffect(() => {
    if (authUser) {
      const userRef = doc(db, "admins", authUser.email);
      const unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) setUser(doc.data());
        else toast.error("Customer not found");
      });
      return () => unsubscribe();
    }
  }, [authUser]);

  return (
    <div className="sidebar">
      <div className="sidebar-menu">
        <div className="sidebar-header">
          <Link
            scroll
            replace
            href="/"
            className="fw-bold text-decoration-none text-black"
          >
            <Image src={logo} width={80} priority alt="logo" />
          </Link>
        </div>

        <ul className="sidebar-child">
          <li>
            <Link
              scroll
              replace
              href="/admin"
              className={`sidebar-child-btn justify-content-start ${
                pathname === "/admin" ? "text-black" : ""
              }`}
            >
              <StatusUp
                color={pathname === "/admin" ? "black" : "#808080"}
                size={24}
                className="me-2"
              />
              Dashboard
            </Link>
          </li>
        </ul>
      </div>

      {user && (
        <button
          onClick={logout}
          className="btn btn-lg btn-dark sidebar-user-btn"
        >
          <Logout color="white" size={24} variant="Bulk" className="me-2" />
          Log Out
        </button>
      )}
    </div>
  );
};

export default Siderbar;
