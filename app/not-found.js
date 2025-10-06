"use client";

import Image from "next/image";
import Link from "next/link";
import notFound from "@/public/images/not_found.svg";

const NotFound = () => (
  <div className="container d-flex justify-content-center align-items-center vh-100">
    <div className="row">
      <div className="col-12 text-center">
        <Image src={notFound} alt="not found" priority width={150} />

        <div className="mt-5">
          <h3 className="fw-bold">Page Not Found</h3>

          <p className="text-muted">This page does not exist</p>

          <Link href="/" className="btn btn-lg btn-dark mt-3">
            Back Home
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default NotFound;
