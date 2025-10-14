"use client";

import Link from "next/link";
import Cookies from "js-cookie";
import { useAuth } from "@/app/_components/backend/auth_context";
import { db } from "@/app/_components/backend/config";
import { useState } from "react";
import { toast } from "react-toastify";
import Loader from "@/app/_components/loader";
import { useRouter } from "next/navigation";
import { Information } from "iconsax-react";
import logo from "@/public/logos/logo.png";
import Image from "next/image";
import { doc, getDoc } from "firebase/firestore";

const Signin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { loading, authUser, signin } = useAuth();
  const router = useRouter();

  if (loading && authUser) return <Loader fullHeight={true} />;

  if (authUser && Cookies.get("AdminNaursSignedIn")) {
    return (
      <div className="d-flex align-items-center vh-100">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 text-center">
              <Information size={150} color="black" />
              <p>You logged in already.</p>

              <hr />

              <div className="d-flex justify-content-center">
                <Link href="/" className="btn btn-dark w-50">
                  Back to menu
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const onSignin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    await signin(email, password)
      .then(() => {
        getDoc(doc(db, "admins", email))
          .then(async (doc) => {
            if (doc.exists()) {
              Cookies.set("AdminNaursSignedIn", true, {
                expires: 14,
              });
              toast.dark("Welcome admin");
              router.push("/admin");
            } else
              toast.error("Customers does not exist or has no access", {
                className: "text-danger",
              });
          })
          .catch((error) => {
            toast.error(`Error: ${error.message}`, {
              className: "text-danger",
            });
          })
          .finally((_) => setIsLoading(false));
      })
      .catch((error) => {
        if (
          error.code === "auth/invalid-login-credentials" ||
          error.code === "auth/invalid-credential"
        ) {
          toast.error("Check email & password", {
            className: "text-danger",
          });
        } else if (error.code === "auth/too-many-requests") {
          toast.error("Too many requests", {
            className: "text-danger",
          });
        } else {
          toast.error(`Error: ${error.message}`, {
            className: "text-danger",
          });
        }
      })
      .finally((_) => setIsLoading(false));
  };

  return (
    <div className="d-flex vh-100 text-center">
      <div className="cover-container d-flex w-100 h-100 p-3 mx-auto flex-column">
        <header className="mb-auto" />

        <div className="row justify-content-center">
          <Link href="/">
            <Image src={logo} width={150} priority alt="logo" />
          </Link>

          <form className="col-md-4 text-start mt-5" onSubmit={onSignin}>
            <div className="mb-3">
              <label className="form-label" htmlFor="emailAddress">
                Email Address
              </label>
              <input
                type="email"
                required
                className="form-control cus-form-control"
                id="emailAddress"
                placeholder="name@example.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                type="password"
                required
                className="form-control cus-form-control"
                id="password"
                placeholder="password"
                maxLength={16}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-dark w-100"
            >
              {isLoading ? <Loader /> : "Sign In"}
            </button>
          </form>
        </div>

        <footer className="mt-auto text-muted" />
      </div>
    </div>
  );
};

export default Signin;
