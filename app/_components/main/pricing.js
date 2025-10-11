"use client";

import { Modal } from "react-bootstrap";
import { useState } from "react";

const Pricing = ({ openPricing, onHide }) => {
  const [show, setShow] = useState(!!openPricing);

  const handleClose = () => {
    setShow(false);
    if (onHide) onHide();
  };

  return (
    <Modal
      dialogClassName="modal-85w"
      scrollable
      centered
      backdrop="static"
      show={show}
      onHide={handleClose}
    >
      <Modal.Header className="bg-F1F1" closeButton>
        <Modal.Title>
          <h1>Pricing</h1>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="bg-F1F1">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-12">
              <div className="mb-5">
                <h2 className="fw-normal mb-3">Adult Fitness</h2>
                <img
                  src="/images/pricing/adult_fitness.png"
                  alt="adult_fitness"
                  width="100%"
                />
              </div>

              <div className="mb-5">
                <h2 className="fw-normal mb-3">Adult Fitness - Per Class</h2>
                <img
                  src="/images/pricing/adult_fitness_per_class.png"
                  alt="adult_fitness_per_class"
                  width="100%"
                />
              </div>

              <div className="mb-5">
                <h2 className="fw-normal mb-3">Kids One-To-One Music</h2>
                <img
                  src="/images/pricing/kids_one_to_one_music.png"
                  alt="kids_one_to_one_music"
                  width="100%"
                />
              </div>

              <div className="mb-5">
                <div className="mb-3">
                  <h2 className="fw-normal">Kids Music</h2>
                  <p className="pink">Keyboard · Guitar · Drums · Violin</p>
                </div>

                <img
                  src="/images/pricing/kids_music.png"
                  alt="kids_music"
                  width="100%"
                />

                <img
                  src="/images/pricing/kids_music_benefits.png"
                  alt="kids_music_benefits"
                  className="mt-3"
                  width="100%"
                />
              </div>

              <div className="mb-5">
                <div className="mb-3">
                  <h2 className="fw-normal">Kids Fitness</h2>
                  <p className="pink">
                    Speech & Drama · Aerial Yoga · Gymnastics · Dance
                  </p>
                </div>

                <img
                  src="/images/pricing/kids_fitness.png"
                  alt="kids_fitness"
                  width="100%"
                />
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default Pricing;
