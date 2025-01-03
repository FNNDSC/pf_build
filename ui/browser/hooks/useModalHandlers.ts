interface UseModalHandlersProps {
    openModal: (
        message: string,
        type: "json" | "asciidoc" | "dialog",
        options?: any,
    ) => void;
    completionMessage: string | null;
    responses: Record<string, any>;
    resetPage: () => void;
}

export const useModalHandlers = ({
    openModal,
    completionMessage,
    responses,
    resetPage,
}: UseModalHandlersProps) => {
    const handleNextStepsClick = (): void => {
        if (completionMessage) {
            openModal(completionMessage, "asciidoc");
        }
    };

    const handlePluginTitleFocus = (): void => {
        const gitCommitResponse = responses["gitCommit"];
        if (gitCommitResponse?.status === true) {
            openModal("Do you wish to generate a new plugin?", "dialog", {
                onConfirm: resetPage,
            });
        }
    };

    return { handleNextStepsClick, handlePluginTitleFocus };
};
