"use client";

import { Modal } from "react-bootstrap";
import { useState } from "react";
import capitalize from "@/app/_utils/capitalize";

const ViewClass = ({ selectedClass, onHide }) => {
  const [show, setShow] = useState(!!selectedClass);

  const handleClose = () => {
    setShow(false);
    if (onHide) onHide();
  };

  return (
    <Modal
      dialogClassName="modal-85w"
      centered
      show={show}
      onHide={handleClose}
      backdrop="static"
      contentClassName="custom-modal-content"
    >
      <div
        className="modal-bg position-relative"
        style={{
          backgroundImage: `url(${selectedClass.image})`,
        }}
      >
        {selectedClass.video && (
          <video
            src={selectedClass.video}
            muted
            loop
            autoPlay
            playsInline
            className="w-100 h-100 position-absolute top-0 start-0 object-fit-cover z-0 bg-white"
          />
        )}

        <div className="position-relative z-1 overflow-y-scroll">
          <Modal.Header
            className="transparent sticky-top z-3 pb-2 m-0"
            closeButton
          >
            <Modal.Title>
              <div className="view-class-category">
                {capitalize(selectedClass.category.name)}
                <span className="pink ms-2 font-14">
                  ({capitalize(selectedClass.subcategory.name)})
                </span>
              </div>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="view-class">
            <div className="container-fluid">
              <div className="row">
                <div className="col-md-12">
                  <div className="d-flex justify-content-between align-items-start">
                    <h3 className="m-0 me-2">
                      {capitalize(selectedClass.name)}
                    </h3>

                    <div className="text-end ms-2 d-flex align-items-end justify-content-end flex-column">
                      <div className="view-class-price">
                        Starting from{" "}
                        {selectedClass.category.id === "adult" && (
                          <h6 className="fw-bold m-0 ms-2">
                            {selectedClass.subcategory.id === "gravity" &&
                              "80 "}
                            {selectedClass.subcategory.id === "sky" && "125 "}
                            AED
                          </h6>
                        )}
                        {selectedClass.category.id === "kids" && (
                          <h6 className="fw-bold m-0 ms-2">
                            {selectedClass.subcategory.id === "fine_art" &&
                              "425 "}
                            {selectedClass.subcategory.id === "fitness" &&
                              "360 "}
                            AED
                          </h6>
                        )}
                      </div>

                      {selectedClass.calendar && (
                        <p className="pink mt-2">
                          {capitalize(selectedClass.calendar)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {selectedClass.category.id === "adult" && (
                  <div className="col-md-12 mt-4">
                    <div className="mb-4">
                      <h5 className="fw-normal mb-3">Per Class</h5>

                      {selectedClass.subcategory.id === "sky" && (
                        <img
                          src="/images/pricing/adult_fitness_sky_per_class.png"
                          alt="adult_fitness_sky_per_class"
                          width="100%"
                        />
                      )}

                      {selectedClass.subcategory.id === "gravity" && (
                        <img
                          src="/images/pricing/adult_fitness_gravity_per_class.png"
                          alt="adult_fitness_gravity_per_class"
                          width="100%"
                        />
                      )}
                    </div>

                    <div className="mb-4">
                      <h5 className="fw-normal mb-3">General Classes</h5>
                      <img
                        src="/images/pricing/adult_fitness.png"
                        alt="adult_fitness"
                        width="100%"
                      />
                    </div>
                  </div>
                )}

                {selectedClass.category.id === "kids" && (
                  <div className="col-md-12 mt-4">
                    {selectedClass.subcategory.id === "fine_art" && (
                      <>
                        <div className="mb-4">
                          <h5 className="fw-normal mb-3">
                            One-To-One Music Class
                          </h5>

                          <img
                            src="/images/pricing/kids_one_to_one_music.png"
                            alt="kids_one_to_one_music"
                            width="100%"
                          />

                          <img
                            src="/images/pricing/kids_music_benefits.png"
                            alt="kids_music_benefits"
                            width="100%"
                            className="mt-2"
                          />
                        </div>

                        <div className="mb-4">
                          <h5 className="fw-normal mb-3">General Classes</h5>

                          <img
                            src="/images/pricing/kids_music.png"
                            alt="kids_music"
                            width="100%"
                          />
                        </div>
                      </>
                    )}

                    {selectedClass.subcategory.id === "fitness" && (
                      <>
                        {selectedClass.name
                          .toLowerCase()
                          .includes("karate") && (
                          <div className="mb-4">
                            <h5 className="fw-normal mb-3">Pricing</h5>

                            <img
                              src="/images/pricing/karate.png"
                              alt="karate"
                              width="100%"
                            />
                          </div>
                        )}

                        <div className="mb-4">
                          <h5 className="fw-normal mb-3">General Classes</h5>

                          <img
                            src="/images/pricing/kids_fitness.png"
                            alt="kids_fitness"
                            width="100%"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Modal.Body>
        </div>
      </div>
    </Modal>
  );
};

export default ViewClass;
