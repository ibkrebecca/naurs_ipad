"use client";

import logo from "@/public/logos/logo.png";
import Image from "next/image";

const GlobalError = ({ error, reset }) => {
  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="row justify-content-center">
        <div className="col-12 text-center">
          <Image src={logo} width={150} priority alt="logo" />

          <div className=" mt-5">
            <h4>Something went wrong!</h4>

            <button
              onClick={() => reset()}
              className="btn btn-lg btn-dark mt-3 mx-auto d-block"
            >
              Try again
            </button>
          </div>
        </div>

        <div className="col-md-6 text-center">
          <div className="alert alert-dark mt-4 p-2" role="alert">
            {error.message}
            <hr />
            <b>HASH:</b> {error.digest}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalError;
