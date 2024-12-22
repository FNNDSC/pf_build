import React from "react";

interface ModalHeaderProps {
    isMaximized: boolean;
    onClose: () => void;
    onMaximizeToggle: () => void;
    onMouseDown: (e: React.MouseEvent) => void; // Pass mouse down for dragging
}

const ModalHeader: React.FC<ModalHeaderProps> = ({
    isMaximized,
    onClose,
    onMaximizeToggle,
    onMouseDown,
}) => {
    return (
        <div
            className="modal-header"
            style={{ cursor: isMaximized ? "default" : "grab" }}
            onMouseDown={onMouseDown}
        >
            <button
                className="modal-maximize-button"
                onClick={onMaximizeToggle}
                aria-label={isMaximized ? "Restore modal" : "Maximize modal"}
            />
            <button
                className="modal-close-button"
                onClick={onClose}
                aria-label="Close modal"
            />
        </div>
    );
};

export default ModalHeader;
