import { Step } from "../../types/processSteps";

interface UsePageResetProps {
    setFormValues: (values: any) => void;
    setSteps: React.Dispatch<React.SetStateAction<Step[]>>;
    setResponses: React.Dispatch<React.SetStateAction<Record<string, any>>>;
    closeModal: () => void;
    setCompletionMessage: (message: string | null) => void;
}

export const usePageReset = ({
    setFormValues,
    setSteps,
    setResponses,
    closeModal,
    setCompletionMessage,
}: UsePageResetProps) => {
    const resetPage = (): void => {
        setFormValues({
            plugin_title: "",
            scriptname: "",
            description: "",
            organization: "",
            email: "",
            github_token: "",
            service_url: "http://localhost:8000",
        });

        setSteps([
            { id: 1, name: "repoExists", state: "idle" },
            { id: 2, name: "repoCreateInitial", state: "idle" },
            { id: 3, name: "gitClone", state: "idle" },
            { id: 4, name: "shellEdit", state: "idle" },
            { id: 5, name: "shellExec", state: "idle" },
            { id: 6, name: "gitCommit", state: "idle" },
        ]);

        setResponses({
            repoExists: null,
            repoCreateInitial: null,
            gitClone: null,
            shellEdit: null,
            shellExec: null,
            gitCommit: null,
        });

        closeModal();
        setCompletionMessage(null);
    };

    return { resetPage };
};
