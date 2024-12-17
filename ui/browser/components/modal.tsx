import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow as theme } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: object | null;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, content }) => {
    if (!isOpen || !content) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    &times;
                </button>
                <h2>Step JSON Response</h2>
                <SyntaxHighlighter language="json" style={theme}>
                    {JSON.stringify(content, null, 2)}
                </SyntaxHighlighter>
            </div>
        </div>
    );
};

export default Modal;
