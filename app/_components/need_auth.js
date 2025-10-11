import Link from "next/link";
import logo from "@/public/logos/logo.png";
import Image from "next/image";

export default function NeedAuth() {
  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="row">
        <div className="col-md-12 text-center">
          <Image src={logo} width={150} priority alt="logo" />

          <h4 className="mt-5">You need to be signed in to see this page!</h4>

          <div className="d-flex justify-content-center mt-4">
            <Link href="/admin/signin" className="btn-dash btn-primary">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
