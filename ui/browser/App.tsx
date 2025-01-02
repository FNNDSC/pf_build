import React from "react";
import Form from "./components/form";
import SubwaySteps from "./components/subwaySteps";
import Modal from "./components/modal";
import { executeStates } from "./control";
import { useFormState } from "./hooks/useFormState";
import { useSteps } from "./hooks/useSteps";
import { useModalState } from "./hooks/useModalState";
import "./styles/styles.css";
import logo from "../images/ChRISlogo-color.svg";

const App: React.FC = () => {
    const { formValues, setFormValues, handleChange } = useFormState();
    const {
        steps,
        responses,
        setSteps,
        setResponses,
        handleSubwayStopClick,
        isGitCommitCompleted,
    } = useSteps();
    const {
        modalOpen,
        modalContent,
        modalContentType,
        openModal,
        closeModal,
    } = useModalState();

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        console.log("Form submitted with values:", formValues);
        await executeStates(
            formValues,
            steps,
            setSteps,
            setResponses,
            openModal,
        );
    };

    const handleNextStepsClick = (): void => {
        if (responses.gitCommit?.repo_url) {
            openModal(
                `Your plugin is ready at ${responses.gitCommit.repo_url}`,
                "asciidoc"
            );
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
                    isOpen={modalOpen}
                    content={modalContent}
                    contentType={modalContentType}
                    onClose={closeModal}
                    onResetForm={resetPage}
                />
            </main>
        </div>
    );
};

export default App;
