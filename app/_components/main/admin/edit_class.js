"use client";

import { truncate } from "@/app/_utils/truncate";
import Loader from "@/app/_components/loader";
import { CloseSquare, TickSquare } from "iconsax-react";
import { Modal } from "react-bootstrap";
import { useState } from "react";
import capitalize from "@/app/_utils/capitalize";

const EditClass = ({ selectedClass, onHide }) => {
  const [show, setShow] = useState(!!selectedClass);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const onUpdateClass = async (e) => {
    e.preventDefault();
    setIsLoading(true);
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
          ></form>
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
