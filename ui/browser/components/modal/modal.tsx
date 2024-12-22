import React, { useState, useRef, useEffect } from "react";
import { useModal } from "../modalContext";
import ModalHeader from "./modalHeader";
import ModalBody from "./modalBody";

const Modal: React.FC = () => {
    const { modalOpen, modalContent, modalContentType, setModalOpen } =
        useModal();
    const [isMaximized, setIsMaximized] = useState(false);
    const modalRef = useRef<HTMLDivElement | null>(null);
    const [dragging, setDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    // Handle Dragging
    const handleMouseDown = (e: React.MouseEvent) => {
        if (isMaximized) return; // Disable dragging when maximized
        setDragging(true);
        const rect = modalRef.current?.getBoundingClientRect();
        if (rect) {
            setOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        }
        document.body.classList.add("no-select"); // Disable text selection during drag
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!dragging || !modalRef.current) return;
        modalRef.current.style.left = `${e.clientX - offset.x}px`;
        modalRef.current.style.top = `${e.clientY - offset.y}px`;
    };

    const handleMouseUp = () => {
        setDragging(false);
        document.body.classList.remove("no-select"); // Re-enable text selection
    };

    const handleMaximizeToggle = () => {
        setIsMaximized((prev) => {
            if (!prev && modalRef.current) {
                // Reposition the modal to the top-left corner of the viewport
                modalRef.current.style.left = "0px";
                modalRef.current.style.top = "0px";
            }
            return !prev;
        });
    };

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
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <div
                className={`modal-content ${isMaximized ? "maximized" : ""}`}
                ref={modalRef}
                style={{ position: isMaximized ? "fixed" : "absolute" }}
                onClick={(e) => e.stopPropagation()}
            >
                <ModalHeader
                    isMaximized={isMaximized}
                    onClose={() => setModalOpen(false)}
                    onMaximizeToggle={handleMaximizeToggle}
                    onMouseDown={handleMouseDown}
                />
                <ModalBody
                    content={modalContent}
                    contentType={modalContentType}
                />
            </div>
        </div>
    );
};

export default Modal;
