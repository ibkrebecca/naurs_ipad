"use client";

import { useAuth } from "@/app/_components/backend/auth_context";
import Loader from "@/app/_components/loader";
import Admin from "@/app/_components/main/admin/admin";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const AdminPage = () => {
  const { loading, authUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (authUser) router.push("/admin");
      else router.push("/admin/signin");
    }
  }, [loading, authUser, router]);

  if (authUser) return <Admin />;
  return <Loader fullHeight={true} />;
};

export default AdminPage;
