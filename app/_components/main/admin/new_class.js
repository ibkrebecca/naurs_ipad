"use client";

import Loader from "@/app/_components/loader";
import { TickSquare, Trash } from "iconsax-react";
import { Modal } from "react-bootstrap";
import { useState } from "react";

const NewClass = ({ newClass, onHide }) => {
  const [show, setShow] = useState(!!newClass);
  const [isLoading, setIsLoading] = useState(false);

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
          <form className="row" onSubmit={onNewClass} id="addClass"></form>
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
