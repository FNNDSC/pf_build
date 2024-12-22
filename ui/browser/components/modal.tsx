import React, { useState, useRef, useEffect } from "react";
import Asciidoctor from "@asciidoctor/core";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow as theme } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useModal } from "./modalContext";

const Modal: React.FC = () => {
    const { modalOpen, modalContent, modalContentType, setModalOpen } =
        useModal();

    const [isMaximized, setIsMaximized] = useState(false);
    const modalRef = useRef<HTMLDivElement | null>(null);
    const [dragging, setDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isMaximized) return; // No dragging when maximized
        setDragging(true);
        const rect = modalRef.current?.getBoundingClientRect();
        if (rect) {
            setOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        }
        document.body.classList.add("no-select"); // Disable text selection
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

    const asciidoctor = Asciidoctor();
    const renderedAsciiDoc =
        modalContentType === "asciidoc" && modalContent
            ? asciidoctor.convert(modalContent, { safe: "safe" })
            : null;

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
                <div
                    className="modal-header"
                    style={{ cursor: isMaximized ? "default" : "grab" }}
                    onMouseDown={handleMouseDown}
                >
                    <button
                        className="modal-maximize-button"
                        onClick={() => setIsMaximized((prev) => !prev)}
                        aria-label="Maximize modal"
                    />
                    <button
                        className="modal-close-button"
                        onClick={() => setModalOpen(false)}
                        aria-label="Close modal"
                    />
                </div>
                <div className={`modal-body ${modalContentType}`}>
                    {modalContentType === "asciidoc" && renderedAsciiDoc && (
                        <div
                            dangerouslySetInnerHTML={{
                                __html: renderedAsciiDoc,
                            }}
                        />
                    )}
                    {modalContentType === "json" && (
                        <SyntaxHighlighter
                            language="json"
                            style={theme}
                            wrapLongLines={true}
                        >
                            {modalContent}
                        </SyntaxHighlighter>
                    )}
                    {modalContentType === "dialog" && (
                        <div className="dialog-box">
                            <p className="dialog-text">{modalContent}</p>
                            <div className="dialog-buttons">
                                <button
                                    className="dialog-button dialog-yes"
                                    onClick={() => setModalOpen(false)}
                                >
                                    Yes
                                </button>
                                <button
                                    className="dialog-button dialog-no"
                                    onClick={() => setModalOpen(false)}
                                >
                                    No
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Modal;
