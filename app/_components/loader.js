"use client";

import logo from "@/public/logos/logo.png";
import Image from "next/image";

const Loader = ({
  size = 50,
  isAwait = false,
  fullHeight = false,
  className = "",
  style = {},
}) => {
  if (fullHeight) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Image
          src={logo}
          width={size}
          priority={true}
          alt="logo"
          className="loader-img"
          style={style}
        />
      </div>
    );
  } else {
    return isAwait ? (
      <div className="loader-await" />
    ) : (
      <div className={`loader ${className}`} style={style} />
    );
  }
};

export default Loader;
