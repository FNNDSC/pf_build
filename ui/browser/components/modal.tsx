import React, { useState, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow as theme } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: string | null;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, content }) => {
    const [isMaximized, setIsMaximized] = useState(false);

    const toggleMaximized = () => setIsMaximized((prev) => !prev);

    useEffect(() => {
        const handleKeydown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose(); // Close modal on ESC
            }
        };

        if (isOpen) {
            window.addEventListener("keydown", handleKeydown);
        }

        return () => {
            window.removeEventListener("keydown", handleKeydown);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !content) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className={`modal-content ${isMaximized ? "maximized" : ""}`}
                onClick={(e) => e.stopPropagation()} // Prevent click inside modal
            >
                <div className="modal-header">
                    <button
                        className="modal-maximize-button"
                        onClick={toggleMaximized}
                        aria-label="Maximize modal"
                    />
                    <button
                        className="modal-close-button"
                        onClick={onClose}
                        aria-label="Close modal"
                    />
                </div>
                <SyntaxHighlighter
                    language="json"
                    style={theme}
                    wrapLongLines={true}
                >
                    {content}
                </SyntaxHighlighter>
            </div>
        </div>
    );
};

export default Modal;
