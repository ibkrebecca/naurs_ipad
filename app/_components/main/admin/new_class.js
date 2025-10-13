"use client";

import Loader from "@/app/_components/loader";
import { TickSquare, Trash } from "iconsax-react";
import { Modal } from "react-bootstrap";
import { useState } from "react";
import Image from "next/image";

const NewClass = ({ newClass, onHide }) => {
  const [show, setShow] = useState(!!newClass);
  const [isLoading, setIsLoading] = useState(false);
  const [rawImage, setRawImage] = useState(null);
  const [viewImage, setViewImage] = useState(null);
  const [rawVideo, setRawVideo] = useState(null);
  const [viewVideo, setViewVideo] = useState(null);
  const [name, setName] = useState("");

  const onNewClass = () => {};

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

              <div className="col-md-12">
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
                          <Trash
                            size={16}
                            color="red"
                            className="text-danger"
                          />
                        </div>
                      </div>
                    )}

                    <div className="cus-form-file w-100">
                      <input
                        required
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
                            reader.onload = (e) =>
                              setViewImage(e.target.result);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label className="file-label" htmlFor="viewImage" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-12">
                <div className="mb-3">
                  <label className="form-label" htmlFor="video">
                    Class Background Video (optional)
                  </label>

                  <div className={viewVideo && "d-flex"}>
                    {viewVideo && (
                      <div className="position-relative">
                        <Image
                          src={viewVideo}
                          width={100}
                          height={100}
                          alt="Preview"
                          className="preview-image me-2"
                        />

                        <div
                          onClick={() => setViewVideo(null)}
                          className="pe-active alert alert-danger top-0 start-0 position-absolute py-0 pb-1 px-2 m-1"
                        >
                          <Trash
                            size={16}
                            color="red"
                            className="text-danger"
                          />
                        </div>
                      </div>
                    )}

                    <div className="cus-form-file w-100">
                      <input
                        type="file"
                        accept="image/*"
                        name="viewVideo"
                        className="form-control"
                        id="viewVideo"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          setRawVideo(file);

                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) =>
                              setViewVideo(e.target.result);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label className="file-label" htmlFor="viewVideo" />
                    </div>
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
