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
      contentClassName="custom-modal-content"
    >
      <div
        className="modal-bg"
        style={{
          backgroundImage: `url(${selectedClass.image})`,
        }}
      >
        <Modal.Header className="transparent sticky-top z-3 pb-2" closeButton>
          <Modal.Title>
            <div className="view-class-category">
              {capitalize(selectedClass.category.replaceAll("_", " "))}
            </div>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="view-class">
          <div className="container-fluid">
            <div className="row">
              <div className="col-md-12">
                <div className="d-flex justify-content-between align-items-start">
                  <h4 className="m-0 me-2">{selectedClass.title}</h4>

                  <div className="text-end ms-2 d-flex align-items-end justify-content-end flex-column">
                    <div className="view-class-price">
                      Starting from <h5 className="fw-bold m-0 ms-2">80 AED</h5>
                    </div>

                    {selectedClass.calendar && (
                      <p className="pink mt-2">{selectedClass.calendar}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-md-12">
                <p>Scroll content starts here…</p>
                {[...Array(40)].map((_, i) => (
                  <p key={i}>This is scroll line {i + 1}</p>
                ))}
              </div>
            </div>
          </div>
        </Modal.Body>
      </div>
    </Modal>
  );
};

export default ViewClass;
