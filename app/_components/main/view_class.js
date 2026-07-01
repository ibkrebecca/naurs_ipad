"use client";

import { Modal } from "react-bootstrap";
import { useState } from "react";
import capitalize from "@/app/_utils/capitalize";
import PricingTables from "@/app/_components/main/pricing_tables";

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
                      {selectedClass.startingPrice != null && (
                        <div className="view-class-price">
                          Starting from{" "}
                          <h6 className="fw-bold m-0 ms-2">
                            {selectedClass.startingPrice} AED
                          </h6>
                        </div>
                      )}

                      {selectedClass.calendar && (
                        <p className="pink mt-2">
                          {capitalize(selectedClass.calendar)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <PricingTables tables={selectedClass.pricingTables} />
              </div>
            </div>
          </Modal.Body>
        </div>
      </div>
    </Modal>
  );
};

export default ViewClass;
