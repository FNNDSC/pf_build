import React, {
    createContext,
    useContext,
    useState,
    Dispatch,
    SetStateAction,
    PropsWithChildren,
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
    openModal: (
        content: string,
        contentType: "json" | "asciidoc" | "dialog",
        options?: { onConfirm?: () => void },
    ) => void;
    closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<string | null>(null);
    const [modalContentType, setModalContentType] = useState<
        "json" | "asciidoc" | "dialog"
    >("json");

    const openModal = (
        content: string,
        contentType: "json" | "asciidoc" | "dialog",
        options?: { onConfirm?: () => void },
    ): void => {
        setModalContent(content);
        setModalContentType(contentType);
        setModalOpen(true);
        if (options?.onConfirm) {
            // Store or use onConfirm callback as needed for modal buttons
            modalOnConfirm.current = options.onConfirm;
        }
    };

    const closeModal = (): void => {
        setModalOpen(false);
        setModalContent(null);
        setModalContentType("json");
        modalOnConfirm.current = null; // Clear onConfirm when closing modal
    };

    const modalOnConfirm = React.useRef<(() => void) | null>(null);

    const value = {
        modalOpen,
        setModalOpen,
        modalContent,
        setModalContent,
        modalContentType,
        setModalContentType,
        openModal,
        closeModal,
    };

    return (
        <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
    );
};

export const useModal = (): ModalContextType => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error("useModal must be used within a ModalProvider");
    }
    return context;
};
