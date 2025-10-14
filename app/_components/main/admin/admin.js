"use client";

import Siderbar from "@/app/_components/sidebar";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { BookSquare, Category, Category2, Trash } from "iconsax-react";
import { useEffect, useState } from "react";
import { db } from "@/app/_components/backend/config";
import Loader from "@/app/_components/loader";
import NewClass from "@/app/_components/main/admin/new_class";
import { formatTimestamp } from "@/app/_utils/format_timestamp";
import { truncate } from "@/app/_utils/truncate";
import capitalize from "@/app/_utils/capitalize";
import Image from "next/image";
import Link from "next/link";
import EditClass from "@/app/_components/main/admin/edit_class";

const Admin = () => {
  const [totalClasses, setTotalClasses] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [totalSubCategories, setTotalSubCategories] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [classes, setClasses] = useState(null);
  const [newClass, setNewClass] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

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

      if (total > 0) {
        const totalSubCategories = snap.docs.reduce((sum, doc) => {
          const data = doc.data();
          const subCount = Array.isArray(data.subcategories)
            ? data.subcategories.length
            : 0;
          return sum + subCount;
        }, 0);

        setTotalSubCategories(totalSubCategories);
      } else {
        setTotalSubCategories(0);
      }
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

  const renderTableRow = (c, index) => (
    <tr key={index} className="pe-active" onClick={() => setSelectedClass(c)}>
      <td className="align-middle">
        <div className="d-flex align-items-center">
          <div className="border rounded-2 me-3 p-1">
            <Image
              src={c.image}
              width={30}
              height={30}
              alt="image"
              priority
              className="rounded-1 object-fit-cover"
            />
          </div>
          {truncate(capitalize(c.name), 30)}
        </div>
      </td>
      <td className="align-middle">{c.category.name}</td>

      <td className="align-middle">{c.subcategory.name}</td>

      <td className="align-middle">
        <small className="text-muted">{truncate(capitalize(c.calendar ? c.calendar : "No Date"), 15)}</small>
      </td>

      <td className="align-middle">
        {c.video ? (
          <Link
            href={c.video}
            className="align-middle btn-dark py-1 px-3 text-decoration-none"
          >
            <small className="text-white">View</small>
          </Link>
        ) : (
          <small>No Video</small>
        )}
      </td>

      <td className="align-middle">{formatTimestamp(c.createdOn)}</td>
    </tr>
  );

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

            <div className="col-md-12">
              <div className="p-3 mb-2 mt-3 rounded-4 shadow-sm d-flex justify-content-between align-items-center">
                <h4 className="m-0">All Classes</h4>

                <button
                  className="btn btn-dark"
                  onClick={() => setNewClass(true)}
                >
                  Create Class
                </button>
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

          {!isLoading && classes !== null && classes.length > 0 && (
            <div
              className="col-md-12 dash-body table-responsive px-4 py-0 pb-5"
              style={{ top: "18.5rem" }}
            >
              <table className="table table-hover">
                <thead>
                  <tr className="thead-dash">
                    <th scope="col"># Name</th>
                    <th scope="col">Category</th>
                    <th scope="col">Sub Category</th>
                    <th scope="col">Calendar</th>
                    <th scope="col">Video</th>
                    <th scope="col">Created On</th>
                  </tr>
                </thead>

                <tbody>
                  {classes.map((c, index) => renderTableRow(c, index))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* new class */}
      {newClass && (
        <NewClass newClass={newClass} onHide={() => setNewClass(null)} />
      )}

      {/* edit ad */}
      {selectedClass && (
        <EditClass
          selectedClass={selectedClass}
          onHide={() => setSelectedClass(null)}
        />
      )}
    </main>
  );
};

export default Admin;
