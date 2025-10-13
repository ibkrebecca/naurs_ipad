"use client";

import Siderbar from "@/app/_components/sidebar";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { BookSquare, Category, Category2, Trash } from "iconsax-react";
import { useEffect, useState } from "react";
import { db } from "@/app/_components/backend/config";
import Loader from "@/app/_components/loader";

const Admin = () => {
  const [totalClasses, setTotalClasses] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [totalSubCategories, setTotalSubCategories] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [classes, setClasses] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "classes"), (snap) => {
      const total = snap.size;
      setTotalClasses(total);
    });

    return () => unsubscribe();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "categories"), (snap) => {
      const total = snap.size;
      setTotalCategories(total);
    });

    return () => unsubscribe();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "classes"), orderBy("createdOn", "desc")),
      (snap) => {
        setIsLoading(false);
        setClasses(snap.docs.map((doc) => doc.data()));
      }
    );

    return () => unsubscribe();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main>
      <Siderbar />

      <div className="content">
        <div className="container-fluid">
          {/* header */}
          <div className="row mt-4">
            <div className="col-md-4">
              <div className="p-3 mb-2 border rounded-4">
                <BookSquare color="black" size={50} variant="Bulk" />

                <div className="mt-2">
                  <h3>{totalClasses}</h3>
                  <p className="m-0">Classes</p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-3 mb-2 border rounded-4">
                <Category color="black" size={50} variant="Bulk" />

                <div className="mt-2">
                  <h3>{totalCategories}</h3>
                  <p className="m-0">Categories</p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-3 mb-2 border rounded-4">
                <Category2 color="black" size={50} variant="Bulk" />

                <div className="mt-2">
                  <h3>{totalSubCategories}</h3>
                  <p className="m-0">Sub Categories</p>
                </div>
              </div>
            </div>
          </div>

          {/* body */}
          {isLoading && classes === null && (
            <div className="col-md-12 dash-body d-flex justify-content-center align-items-center">
              <Loader />
            </div>
          )}

          {!isLoading && classes !== null && classes.length === 0 && (
            <div className="col-md-12 dash-body text-muted text-center d-flex flex-column justify-content-center align-items-center">
              <Trash color="black" size={50} variant="Bulk" />
              <p className="mt-4 mb-0">No classes yet</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Admin;
