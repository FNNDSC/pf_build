import React, { useState, useRef } from "react";
import Asciidoctor from "@asciidoctor/core";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow as theme } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void; // Optional handler for dialog confirmations
    content: string | null;
    contentType: "json" | "asciidoc" | "dialog";
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    content,
    contentType,
}) => {
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
        contentType === "asciidoc" && content
            ? asciidoctor.convert(content, { safe: "safe" })
            : null;

    React.useEffect(() => {
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

    if (!isOpen || !content) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
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
                        onClick={onClose}
                        aria-label="Close modal"
                    />
                </div>
                <div className={`modal-body ${contentType}`}>
                    {contentType === "asciidoc" && renderedAsciiDoc && (
                        <div
                            dangerouslySetInnerHTML={{
                                __html: renderedAsciiDoc,
                            }}
                        />
                    )}
                    {contentType === "json" && (
                        <SyntaxHighlighter
                            language="json"
                            style={theme}
                            wrapLongLines={true}
                        >
                            {content}
                        </SyntaxHighlighter>
                    )}
                    {contentType === "dialog" && (
                        <div className="dialog-box">
                            <p className="dialog-text">{content}</p>
                            <div className="dialog-buttons">
                                <button
                                    className="dialog-button dialog-yes"
                                    onClick={() => {
                                        if (onConfirm) onConfirm();
                                        onClose();
                                    }}
                                >
                                    Yes
                                </button>
                                <button
                                    className="dialog-button dialog-no"
                                    onClick={onClose}
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
