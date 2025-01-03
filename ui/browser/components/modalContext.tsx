import React, {
    createContext,
    useContext,
    useState,
    Dispatch,
    SetStateAction,
} from "react";

interface ModalContextType {
    modalOpen: boolean;
    setModalOpen: Dispatch<SetStateAction<boolean>>;
    modalContent: string | null;
    setModalContent: Dispatch<SetStateAction<string | null>>;
    modalContentType: "json" | "asciidoc" | "dialog";
    setModalContentType: Dispatch<
        SetStateAction<"json" | "asciidoc" | "dialog">
    >;
    openModal: (content: string, type: "json" | "asciidoc" | "dialog") => void;
    closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<string | null>(null);
    const [modalContentType, setModalContentType] = useState<
        "json" | "asciidoc" | "dialog"
    >("json");

    const openModal = (
        content: string,
        type: "json" | "asciidoc" | "dialog",
    ) => {
        setModalContent(content);
        setModalContentType(type);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setModalContent(null);
    };

    return (
        <ModalContext.Provider
            value={{
                modalOpen,
                setModalOpen,
                modalContent,
                setModalContent,
                modalContentType,
                setModalContentType,
                openModal,
                closeModal,
            }}
        >
            {children}
        </ModalContext.Provider>
    );
};

export const useModal = (): ModalContextType => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error("useModal must be used within a ModalProvider");
    }
    return context;
};
