"use client";

import { truncate } from "@/app/_utils/truncate";
import Loader from "@/app/_components/loader";
import { CloseSquare, TickSquare, Trash } from "iconsax-react";
import { Modal } from "react-bootstrap";
import { useEffect, useRef, useState } from "react";
import capitalize from "@/app/_utils/capitalize";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/app/_components/backend/config";
import ReactSelect from "react-select";
import { selectFormStyle, selectFormTheme } from "@/app/_utils/input_style";
import Image from "next/image";
import { toast } from "react-toastify";

const EditClass = ({ selectedClass, onHide }) => {
  const [show, setShow] = useState(!!selectedClass);
  const formRef = useRef();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [rawImage, setRawImage] = useState(null);
  const [viewImage, setViewImage] = useState(selectedClass.image);
  const [rawVideo, setRawVideo] = useState(null);
  const [viewVideo, setViewVideo] = useState(selectedClass.video);
  const [categories, setCategories] = useState(null);
  const [category, setCategory] = useState(selectedClass.category);
  const [subCategory, setSubCategory] = useState(selectedClass.subcategory);
  const [name, setName] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "categories"), orderBy("createdOn", "desc")),
      (snap) => setCategories(snap.docs.map((doc) => doc.data()))
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onUpdateClass = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const classesRef = doc(db, "classes", selectedClass.id);

    const updateClass_ = {
      image: viewImage,
      video: viewVideo,
      name: name.length <= 0 ? selectedClass.name : name,
      category: category?.value || selectedClass.category,
      subcategory: subCategory?.value || selectedClass.subcategory,
    };

    if (rawImage) {
      try {
        const imageUrl = await imageToGithub(rawImage);
        updateClass_.image = imageUrl;
      } catch (e) {
        toast.error(`Error uploading image: ${e}`, {
          className: "text-danger",
        });
      }
    }

    if (rawVideo) {
      try {
        const videoUrl = await videoToGithub(rawVideo);
        updateClass_.video = videoUrl;
      } catch (e) {
        toast.error(`Error uploading video: ${e}`, {
          className: "text-danger",
        });
      }
    }

    onDbUpdate(classesRef, updateClass_);
    toast.success("Class updated successfully!");
  };

  const onDbUpdate = (ref, data) => {
    updateDoc(ref, data)
      .then(() => {
        formRef.current?.reset();
        handleClose();
        toast.dark("Class updated successfully");
      })
      .catch((e) => {
        toast.error(`Error occured: ${e}`, {
          className: "text-danger",
        });
      })
      .finally((_) => setIsLoading(false));
  };

  const handleClose = () => {
    setShow(false);
    if (onHide) onHide();
  };

  return (
    <Modal
      scrollable
      centered
      backdrop="static"
      show={show}
      onHide={() => handleClose()}
    >
      <Modal.Header closeButton>
        <Modal.Title className="h1">
          {truncate(capitalize(selectedClass.name), 80)}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="container-fluid">
          <form
            className="row"
            onSubmit={onUpdateClass}
            id="updateClass"
            ref={formRef}
          >
            <div className="col-md-12">
              <div className="mb-3">
                <label className="form-label" htmlFor="name">
                  Class Name
                </label>

                <input
                  type="text"
                  className="form-control cus-form-control"
                  id="name"
                  placeholder={capitalize(selectedClass.name)}
                  defaultValue={capitalize(selectedClass.name)}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {categories !== null && (
                <div className="mb-3">
                  <label className="form-label" htmlFor="category">
                    Class Category
                  </label>

                  <ReactSelect
                    id="category"
                    placeholder="select category"
                    options={categories.map((cat) => ({
                      label: capitalize(cat.name),
                      value: cat,
                    }))}
                    styles={selectFormStyle}
                    theme={selectFormTheme}
                    defaultInputValue={selectedClass.category.name}
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
                    id="subcategory"
                    placeholder="select category"
                    options={(category.value
                      ? category.value.subcategories
                      : category.subcategories
                    ).map((sub) => ({
                      label: capitalize(sub.name),
                      value: sub,
                    }))}
                    styles={selectFormStyle}
                    theme={selectFormTheme}
                    defaultInputValue={selectedClass.subcategory.name}
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

      <Modal.Footer className="col-md-12 d-flex justify-content-between">
        <button
          type="button"
          disabled={isDeleteLoading}
          onClick={() => {}}
          className="btn bg-danger text-white"
        >
          <CloseSquare size={20} color="white" />
          {isDeleteLoading ? <Loader /> : "Delete Class"}
        </button>

        <button
          type="submit"
          form="updateClass"
          disabled={isLoading}
          className="btn btn-dark"
        >
          <TickSquare size={20} color="white" />
          {isLoading ? <Loader /> : "Update Class"}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditClass;
