"use client";

import { truncate } from "@/app/_utils/truncate";
import Loader from "@/app/_components/loader";
import { CloseSquare, TickSquare, Trash } from "iconsax-react";
import { Modal } from "react-bootstrap";
import { useEffect, useRef, useState } from "react";
import capitalize from "@/app/_utils/capitalize";
import {
  collection,
  deleteDoc,
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
import uploadToFirebase from "@/app/_utils/upload_to_firebase";
import PricingEditor from "@/app/_components/main/admin/pricing_editor";

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
  const [calendar, setCalendar] = useState("");
  const [startingPrice, setStartingPrice] = useState(
    selectedClass.startingPrice ?? "",
  );
  const [pricingTables, setPricingTables] = useState(
    selectedClass.pricingTables ?? [],
  );
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadLabel, setUploadLabel] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "categories"), orderBy("createdOn", "desc")),
      (snap) => setCategories(snap.docs.map((doc) => doc.data())),
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onUpdateClass = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const classesRef = doc(db, "classes", selectedClass.id);

      const updateClass_ = {
        image: viewImage,
        video: viewVideo,
        name: name.length <= 0 ? selectedClass.name : name,
        calendar: calendar.length <= 0 ? selectedClass.calendar : calendar,
        startingPrice: startingPrice === "" ? null : Number(startingPrice),
        pricingTables,
        category: category?.value || selectedClass.category,
        subcategory: subCategory?.value || selectedClass.subcategory,
      };

      if (rawImage) {
        setUploadLabel("Image");
        setUploadProgress(0);
        updateClass_.image = await uploadToFirebase(rawImage, {
          resourceType: "image",
          onProgress: (pct) => setUploadProgress(pct),
        });
        setUploadProgress(null);
      }

      if (rawVideo) {
        setUploadLabel("Compressing Video");
        setUploadProgress(0);
        updateClass_.video = await uploadToFirebase(rawVideo, {
          resourceType: "video",
          onCompressProgress: (pct) => setUploadProgress(pct),
          onProgress: (pct) => {
            setUploadLabel("Video");
            setUploadProgress(pct);
          },
        });
        setUploadProgress(null);
      }

      await updateDoc(classesRef, updateClass_);

      formRef.current?.reset();
      handleClose();
      toast.dark("Class updated successfully");
    } catch (err) {
      toast.error(`${err.message || err}`, { className: "text-danger" });
    } finally {
      setIsLoading(false);
    }
  };

  const onDeleteClass = () => {
    setIsDeleteLoading(true);

    deleteDoc(doc(db, "classes", selectedClass.id))
      .then(() => {
        formRef.current?.reset();
        handleClose();
        toast.dark("Class deleted successfully");
      })
      .catch((e) => {
        toast.error(`Error occured: ${e}`, {
          className: "text-danger",
        });
      })
      .finally((_) => setIsDeleteLoading(false));
  };

  const handleClose = () => {
    setShow(false);
    if (onHide) onHide();
  };

  return (
    <Modal
      size="lg"
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

              <div className="mb-3">
                <label className="form-label" htmlFor="calendar">
                  Class Calendar (optional)
                </label>

                <input
                  type="text"
                  className="form-control cus-form-control"
                  id="calendar"
                  placeholder={capitalize(selectedClass.calendar ?? "")}
                  defaultValue={capitalize(selectedClass.calendar ?? "")}
                  onChange={(e) => setCalendar(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="startingPrice">
                  Starting Price in AED (optional)
                </label>

                <input
                  type="number"
                  min="0"
                  className="form-control cus-form-control"
                  id="startingPrice"
                  placeholder="80"
                  value={startingPrice}
                  onChange={(e) => setStartingPrice(e.target.value)}
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

              <PricingEditor
                value={pricingTables}
                onChange={setPricingTables}
              />
            </div>
          </form>
        </div>
      </Modal.Body>

      <Modal.Footer className="col-md-12 d-flex flex-column align-items-stretch">
        {uploadProgress !== null && (
          <div className="w-100 mb-2">
            <small className="text-muted">
              Uploading {uploadLabel}… {uploadProgress}%
            </small>
            <div className="progress" style={{ height: 6 }}>
              <div
                className="progress-bar progress-bar-striped progress-bar-animated bg-dark"
                style={{ width: `${uploadProgress}%` }}
                role="progressbar"
                aria-valuenow={uploadProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        )}
        <div className="d-flex justify-content-between">
          <button
            type="button"
            disabled={isDeleteLoading}
            onClick={() => onDeleteClass()}
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
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default EditClass;
