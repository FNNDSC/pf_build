import { useState } from "react";

export const useModalState = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<string | null>(null);
    const [modalContentType, setModalContentType] = useState<
        "json" | "asciidoc" | "dialog"
    >("json");

    const openModal = (
        content: string,
        contentType: "json" | "asciidoc" | "dialog",
    ) => {
        console.log(`opening modal with content... ${content}`);
        setModalContent(content);
        setModalContentType(contentType);
        setModalOpen(true);
        console.log("State after openModal:", {
            modalOpen,
            modalContent,
            modalContentType,
        });
    };

    const closeModal = () => {
        setModalOpen(false);
        setModalContent(null);
    };

    return {
        modalOpen,
        modalContent,
        modalContentType,
        setModalOpen,
        setModalContent,
        setModalContentType,
        openModal,
        closeModal,
    };
};
