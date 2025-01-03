// hooks/useFormHandlers.ts
import { useState } from "react";
import { executeStates } from "../control";
import { Step } from "../../types/processSteps";

interface FormValues {
    [key: string]: string;
    plugin_title: string;
    scriptname: string;
    description: string;
    organization: string;
    email: string;
    github_token: string;
    service_url: string;
}

interface UseFormHandlersReturn {
    formValues: FormValues;
    setFormValues: React.Dispatch<React.SetStateAction<FormValues>>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSubmit: (
        e: React.FormEvent,
        steps: Step[],
        setSteps: React.Dispatch<React.SetStateAction<Step[]>>,
        setResponses: React.Dispatch<React.SetStateAction<Record<string, any>>>,
        openModal: (message: string, type: string) => void,
        setCompletionMessage: React.Dispatch<
            React.SetStateAction<string | null>
        >,
    ) => Promise<void>;
}

const useFormHandlers = (): UseFormHandlersReturn => {
    const [formValues, setFormValues] = useState<FormValues>({
        plugin_title: "",
        scriptname: "",
        description: "",
        organization: "",
        email: "",
        github_token: "",
        service_url: "http://localhost:8000",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target;
        setFormValues((prevValues) => ({ ...prevValues, [name]: value }));
    };

    const handleSubmit = async (
        e: React.FormEvent,
        steps: Step[],
        setSteps: React.Dispatch<React.SetStateAction<Step[]>>,
        setResponses: React.Dispatch<React.SetStateAction<Record<string, any>>>,
        openModal: (message: string, type: string) => void,
        setCompletionMessage: React.Dispatch<
            React.SetStateAction<string | null>
        >,
    ): Promise<void> => {
        e.preventDefault();
        try {
            console.log("Submitting form with values:", formValues);
            await executeStates(
                formValues,
                steps,
                setSteps,
                setResponses,
                openModal,
                setCompletionMessage,
            );
            console.log("Form submission successful");
        } catch (error) {
            console.error("Error during form submission:", error);
        }
    };

    return { formValues, setFormValues, handleChange, handleSubmit };
};

export default useFormHandlers;
