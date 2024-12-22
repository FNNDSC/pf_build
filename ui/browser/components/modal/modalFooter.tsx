import React from "react";

interface ModalFooterProps {
    onConfirm: () => void;
    onCancel: () => void;
}

const ModalFooter: React.FC<ModalFooterProps> = ({ onConfirm, onCancel }) => {
    return (
        <div className="modal-footer">
            <button className="dialog-button dialog-yes" onClick={onConfirm}>
                Yes
            </button>
            <button className="dialog-button dialog-no" onClick={onCancel}>
                No
            </button>
        </div>
    );
};

export default ModalFooter;
