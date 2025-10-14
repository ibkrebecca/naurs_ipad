"use client";

import Loader from "@/app/_components/loader";
import { TickSquare, Trash } from "iconsax-react";
import { Modal } from "react-bootstrap";
import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "react-toastify";
import imageToGithub from "@/app/_utils/image_to_github";
import videoToGithub from "@/app/_utils/video_to_github";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { selectFormStyle, selectFormTheme } from "@/app/_utils/input_style";
import { db } from "@/app/_components/backend/config";
import ReactSelect from "react-select";
import capitalize from "@/app/_utils/capitalize";

const NewClass = ({ newClass, onHide }) => {
  const [show, setShow] = useState(!!newClass);
  const [isLoading, setIsLoading] = useState(false);
  const [rawImage, setRawImage] = useState(null);
  const [viewImage, setViewImage] = useState(null);
  const [rawVideo, setRawVideo] = useState(null);
  const [viewVideo, setViewVideo] = useState(null);
  const [categories, setCategories] = useState(null);
  const [category, setCategory] = useState(null);
  const [subCategory, setSubCategory] = useState(null);
  const [name, setName] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "categories"), orderBy("createdOn", "desc")),
      (snap) => setCategories(snap.docs.map((doc) => doc.data()))
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onNewClass = async (e) => {
    e.preventDefault();

    if (!rawImage) {
      toast.error("Add class background image", {
        className: "text-danger",
      });
    } else {
      setIsLoading(true);
      toast.dark("Compressing and uploading Image");

      const classesRef = collection(db, "classes");
      imageToGithub(rawImage).then((image) => {
        const newClass_ = {
          image: image,
          video: null,
          name: name,
          category: category.value,
          subcategory: subCategory.value,
          createdOn: serverTimestamp(),
        };

        if (rawVideo) {
          toast.dark("Uploading Video");
          videoToGithub(rawVideo).then((video) => {
            newClass_.video = video;

            onDbUpdate(classesRef, newClass_);
          });
        } else {
          onDbUpdate(classesRef, newClass_);
        }
      });
    }
  };

  const onDbUpdate = (ref, data) => {
    setDoc(ref, data)
      .then(() => toast.dark("Class added successfully"))
      .catch((e) => {
        toast.dark(`Error adding class: ${e}`, {
          className: "text-danger",
        });
      })
      .finally(() => setIsLoading(flase));
  };

  const handleClose = () => {
    setShow(false);
    if (onHide) onHide();
  };

  return (
    <Modal scrollable centered show={show} onHide={() => handleClose()}>
      <Modal.Header closeButton>
        <Modal.Title className="h1">Add Class</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="container-fluid">
          <form className="row" onSubmit={onNewClass} id="addClass">
            <div className="col-md-12">
              <div className="mb-3">
                <label className="form-label" htmlFor="name">
                  Class Name
                </label>

                <input
                  type="text"
                  required
                  className="form-control cus-form-control"
                  id="name"
                  placeholder="dance class"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {categories !== null && (
                <div className="mb-3">
                  <label className="form-label" htmlFor="category">
                    Class Category
                  </label>

                  <ReactSelect
                    required
                    id="category"
                    placeholder="select category"
                    options={categories.map((cat) => ({
                      label: capitalize(cat.name),
                      value: cat,
                    }))}
                    styles={selectFormStyle}
                    theme={selectFormTheme}
                    onChange={(option) => setCategory(option)}
                  />
                </div>
              )}

              {category !== null && (
                <div className="mb-3">
                  <label className="form-label" htmlFor="subcategory">
                    Class Sub Category
                  </label>

                  <ReactSelect
                    required
                    id="subcategory"
                    placeholder="select category"
                    options={category.value.subcategories.map((sub) => ({
                      label: capitalize(sub.name),
                      value: sub,
                    }))}
                    styles={selectFormStyle}
                    theme={selectFormTheme}
                    onChange={(option) => setSubCategory(option)}
                  />
                </div>
              )}

              <div className="mb-3">
                <label className="form-label" htmlFor="rawImage">
                  Class Background Image
                </label>

                <div className={viewImage && "d-flex"}>
                  {viewImage && (
                    <div className="position-relative">
                      <Image
                        src={viewImage}
                        width={100}
                        height={100}
                        alt="Preview"
                        className="preview-image me-2"
                      />

                      <div
                        onClick={() => setViewImage(null)}
                        className="pe-active alert alert-danger top-0 start-0 position-absolute py-0 pb-1 px-2 m-1"
                      >
                        <Trash size={16} color="red" className="text-danger" />
                      </div>
                    </div>
                  )}

                  <div className="cus-form-file w-100">
                    <input
                      type="file"
                      accept="image/*"
                      name="viewImage"
                      className="form-control"
                      id="viewImage"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        setRawImage(file);

                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => setViewImage(e.target.result);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label className="file-label" htmlFor="viewImage" />
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="video">
                  Class Background Video (optional)
                </label>

                <div className={viewVideo && "d-flex"}>
                  {viewVideo && (
                    <div className="position-relative">
                      <video
                        src={viewVideo}
                        muted
                        loop
                        autoPlay
                        playsInline
                        width={100}
                        height={100}
                        className="preview-image me-2"
                      />

                      <div
                        onClick={() => setViewVideo(null)}
                        className="pe-active alert alert-danger top-0 start-0 position-absolute py-0 pb-1 px-2 m-1"
                      >
                        <Trash size={16} color="red" className="text-danger" />
                      </div>
                    </div>
                  )}

                  <div className="cus-form-file w-100">
                    <input
                      type="file"
                      accept="video/*"
                      name="viewVideo"
                      className="form-control"
                      id="viewVideo"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        setRawVideo(file);

                        if (file) {
                          const videoURL = URL.createObjectURL(file);
                          setViewVideo(videoURL);
                        }
                      }}
                    />
                    <label className="file-label" htmlFor="viewVideo" />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </Modal.Body>

      <Modal.Footer className="col-md-12 d-flex justify-content-end">
        <button
          type="submit"
          form="addClass"
          disabled={isLoading}
          className="btn btn-dark"
        >
          <TickSquare color="white" size={20} />
          {isLoading ? <Loader /> : "Add Class"}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default NewClass;
