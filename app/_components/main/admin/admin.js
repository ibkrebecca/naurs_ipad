"use client";

import Siderbar from "@/app/_components/sidebar";
import { collection, onSnapshot } from "firebase/firestore";
import { BookSquare, Category, Category2 } from "iconsax-react";
import { useEffect, useState } from "react";
import { db } from "@/app/_components/backend/config";

const Admin = () => {
  const [totalClasses, setTotalClasses] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [totalSubCategories, setTotalSubCategories] = useState(0);

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
        </div>
      </div>
    </main>
  );
};

export default Admin;
