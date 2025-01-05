import React, {
    createContext,
    useContext,
    useState,
    Dispatch,
    SetStateAction,
    PropsWithChildren,
} from "react";

interface ValidationOptions {
    onEdit: () => void;
    canContinue: boolean;
}

interface ModalOptions {
    onConfirm?: () => void;
    validation?: ValidationOptions;
}

interface ModalContextType {
    modalOpen: boolean;
    setModalOpen: Dispatch<SetStateAction<boolean>>;
    modalContent: string | null;
    setModalContent: Dispatch<SetStateAction<string | null>>;
    modalContentType: "json" | "asciidoc" | "dialog" | "validation";
    setModalContentType: Dispatch<
        SetStateAction<"json" | "asciidoc" | "dialog" | "validation">
    >;
    modalValidationOptions: ValidationOptions | null;
    openModal: (
        content: string,
        contentType: "json" | "asciidoc" | "dialog" | "validation",
        options?: ModalOptions,
    ) => void;
    closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<string | null>(null);
    const [modalContentType, setModalContentType] = useState<
        "json" | "asciidoc" | "dialog" | "validation"
    >("json");
    const [modalValidationOptions, setModalValidationOptions] =
        useState<ValidationOptions | null>(null);
    const modalOnConfirm = React.useRef<(() => void) | null>(null);

    const openModal = (
        content: string,
        contentType: "json" | "asciidoc" | "dialog" | "validation",
        options?: ModalOptions,
    ): void => {
        setModalContent(content);
        setModalContentType(contentType);
        setModalOpen(true);
        if (options?.onConfirm) {
            modalOnConfirm.current = options.onConfirm;
        }
        if (options?.validation) {
            setModalValidationOptions(options.validation);
        }
    };

    const closeModal = (): void => {
        if (
            modalContentType === "validation" &&
            modalValidationOptions?.onEdit
        ) {
            modalValidationOptions.onEdit();
        }
        setModalOpen(false);
        setModalContent(null);
        setModalContentType("json");
        setModalValidationOptions(null);
        modalOnConfirm.current = null;
    };

    const value = {
        modalOpen,
        setModalOpen,
        modalContent,
        setModalContent,
        modalContentType,
        setModalContentType,
        modalValidationOptions,
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
