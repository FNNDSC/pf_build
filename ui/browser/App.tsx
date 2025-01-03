import React, { useState } from "react";
import Form from "./components/form";
import SubwaySteps from "./components/subwaySteps";
import Modal from "./components/modal";
import { executeStates } from "./control";
import { useFormState } from "./hooks/useFormState";
import { useSteps } from "./hooks/useSteps";
// import { useModalState } from "./hooks/useModalState";
import { useModal } from "./components/modalContext";
import "./styles/styles.css";
import logo from "../images/ChRISlogo-color.svg";

const App: React.FC = () => {
    const { formValues, setFormValues, handleChange } = useFormState();
    const { openModal, closeModal } = useModal();

    const {
        steps,
        responses,
        setSteps,
        setResponses,
        handleSubwayStopClick,
        isGitCommitCompleted,
    } = useSteps({ openModal });

    const [completionMessage, setCompletionMessage] = useState<string | null>(
        null,
    );

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        console.log("Form submitted with values:", formValues);
        await executeStates(
            formValues,
            steps,
            setSteps,
            setResponses,
            openModal,
            setCompletionMessage, // Correctly passing completion message handler
        );
    };

    const handleNextStepsClick = (): void => {
        if (completionMessage) {
            openModal(completionMessage, "asciidoc");
        }
    };

    const handlePluginTitleFocus = (): void => {
        const gitCommitResponse = responses["gitCommit"];
        if (gitCommitResponse?.status === true) {
            openModal("Do you wish to generate a new plugin?", "dialog");
        }
    };

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

    return (
        <div className="app-container">
            <header className="app-header">
                <img src={logo} alt="ChRIS Logo" className="app-logo" />
                <h1 className="header-title">ChRIS Plugin Factory</h1>
            </header>
            <main className="app-content">
                <p className="intro-text">
                    Welcome to the ChRIS Plugin Factory -- the easiest way to
                    get started coding your ChRIS application! Fill in the form
                    and hit "Submit".
                </p>
                <Form
                    formValues={formValues}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                    onFocusPluginTitle={handlePluginTitleFocus} // Correctly passing focus handler
                />
                <SubwaySteps
                    steps={steps}
                    onStepClick={handleSubwayStopClick}
                />
                {isGitCommitCompleted && (
                    <button
                        className="form-submit"
                        onClick={handleNextStepsClick}
                    >
                        Next Steps
                    </button>
                )}
                <Modal
                    onResetForm={resetPage} // Correctly passing the reset function
                />
            </main>
        </div>
    );
};

export default App;
