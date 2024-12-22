import React, { createContext, useState, useContext } from "react";

interface ModalContextProps {
    modalOpen: boolean;
    modalContent: string | null;
    modalContentType: "json" | "asciidoc" | "dialog";
    setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setModalContent: React.Dispatch<React.SetStateAction<string | null>>;
    setModalContentType: React.Dispatch<
        React.SetStateAction<"json" | "asciidoc" | "dialog">
    >;
}

const ModalContext = createContext<ModalContextProps | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<string | null>(null);
    const [modalContentType, setModalContentType] = useState<
        "json" | "asciidoc" | "dialog"
    >("json");

    return (
        <ModalContext.Provider
            value={{
                modalOpen,
                modalContent,
                modalContentType,
                setModalOpen,
                setModalContent,
                setModalContentType,
            }}
        >
            {children}
        </ModalContext.Provider>
    );
};

export const useModal = (): ModalContextProps => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error("useModal must be used within a ModalProvider");
    }
    return context;
};
