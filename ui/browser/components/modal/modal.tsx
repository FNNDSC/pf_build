import React, { useState, useRef, useEffect } from "react";
import { useModal } from "../modalContext";
import ModalHeader from "./modalHeader";
import ModalBody from "./modalBody";

interface ModalProps {
    onResetForm: () => void;
}

const Modal: React.FC<ModalProps> = ({ onResetForm }) => {
    const {
        modalOpen,
        modalContent,
        modalContentType,
        setModalOpen,
        modalValidationOptions,
        modalOnConfirm,
        closeModal,
    } = useModal();

    const [isMaximized, setIsMaximized] = useState(false);
    const modalRef = useRef<HTMLDivElement | null>(null);
    const [dragging, setDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isMaximized) return;
        setDragging(true);
        const rect = modalRef.current?.getBoundingClientRect();
        if (rect) {
            setOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        }
        document.body.classList.add("no-select");
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!dragging || !modalRef.current) return;
        modalRef.current.style.left = `${e.clientX - offset.x}px`;
        modalRef.current.style.top = `${e.clientY - offset.y}px`;
    };

    const handleMouseUp = () => {
        setDragging(false);
        document.body.classList.remove("no-select");
    };

    const handleMaximizeToggle = () => {
        setIsMaximized((prev) => {
            if (!prev && modalRef.current) {
                modalRef.current.style.left = "0px";
                modalRef.current.style.top = "0px";
            }
            return !prev;
        });
    };

    const handleDialogConfirm = () => {
        if (modalContentType === "validation") {
            if (modalOnConfirm) {
                modalOnConfirm();
            }
        } else {
            onResetForm();
        }
        setModalOpen(false);
    };

    const handleDialogCancel = () => {
        closeModal();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
            closeModal();
        }
    };

    useEffect(() => {
        if (modalOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [modalOpen]);

    useEffect(() => {
        if (dragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        } else {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [dragging]);

    if (!modalOpen || !modalContent) return null;

    return (
        <div className="modal-overlay" onClick={handleDialogCancel}>
            <div
                className={`modal-content ${isMaximized ? "maximized" : ""}`}
                ref={modalRef}
                style={{ position: isMaximized ? "fixed" : "absolute" }}
                onClick={(e) => e.stopPropagation()}
            >
                <ModalHeader
                    isMaximized={isMaximized}
                    onClose={handleDialogCancel}
                    onMaximizeToggle={handleMaximizeToggle}
                    onMouseDown={handleMouseDown}
                />
                <ModalBody
                    content={modalContent}
                    contentType={modalContentType}
                    onConfirm={handleDialogConfirm}
                    onCancel={handleDialogCancel}
                    validationOptions={modalValidationOptions || undefined}
                />
            </div>
        </div>
    );
};

export default Modal;
