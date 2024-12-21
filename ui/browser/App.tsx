import React, { useState, useEffect } from "react";
import Form from "./components/form";
import { executeStates } from "./control";
import SubwaySteps from "./components/subwaySteps";
import Modal from "./components/modal";
import CompletionMessage from "./components/completionMessage";
import { Step } from "../types/processSteps";
import { StateEnum, StateResponse } from "../lib/stateMapping";
import "./styles/styles.css";
import logo from "../images/ChRISlogo-color.svg";

const App: React.FC = () => {
    const initialFormValues = {
        plugin_title: "",
        scriptname: "",
        description: "",
        organization: "",
        email: "",
        github_token: "",
        service_url: "http://localhost:8000",
    };

    const initialSteps: Step[] = [
        { id: 1, name: "repoExists", state: "idle" },
        { id: 2, name: "repoCreateInitial", state: "idle" },
        { id: 3, name: "gitClone", state: "idle" },
        { id: 4, name: "shellEdit", state: "idle" },
        { id: 5, name: "shellExec", state: "idle" },
        { id: 6, name: "gitCommit", state: "idle" },
    ];

    const initialResponses: Record<StateEnum, StateResponse | null> = {
        repoExists: null,
        repoCreateInitial: null,
        gitClone: null,
        shellEdit: null,
        shellExec: null,
        gitCommit: null,
    };

    const [formValues, setFormValues] = useState(initialFormValues);
    const [steps, setSteps] = useState<Step[]>(initialSteps);
    const [responses, setResponses] =
        useState<Record<StateEnum, StateResponse | null>>(initialResponses);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<string | null>(null);
    const [completionMessage, setCompletionMessage] = useState<string | null>(
        null,
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target;
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        console.log("Form submitted with values:", formValues);
        await executeStates(
            formValues,
            steps,
            setSteps,
            setResponses,
            setCompletionMessage,
        );
    };

    const handleSubwayStopClick = (stepIndex: number): void => {
        const step = steps.find((s) => s.id === stepIndex + 1);
        if (step) {
            const response = responses[step.name];
            if (response) {
                setModalContent(JSON.stringify(response, null, 2)); // Format the JSON for readability
                setModalOpen(true);
            } else {
                setModalContent(`No response available for step: ${step.name}`);
                setModalOpen(true);
            }
        }
    };

    const handlePluginTitleFocus = (): void => {
        const gitCommitResponse = responses["gitCommit"];
        if (gitCommitResponse?.status === true) {
            setModalContent("Hit Enter to clear page or hit Esc");
            setModalOpen(true);
        }
    };

    const resetPage = (): void => {
        setFormValues(initialFormValues);
        setSteps(initialSteps);
        setResponses(initialResponses);
        setCompletionMessage(null);
        setModalOpen(false);
    };

    const handleModalKeydown = (e: KeyboardEvent): void => {
        if (e.key === "Enter") {
            resetPage();
        } else if (e.key === "Escape") {
            setModalOpen(false);
        }
    };

    useEffect(() => {
        if (modalOpen) {
            window.addEventListener("keydown", handleModalKeydown);
        } else {
            window.removeEventListener("keydown", handleModalKeydown);
        }

        return () => {
            window.removeEventListener("keydown", handleModalKeydown);
        };
    }, [modalOpen]);

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
                    onFocusPluginTitle={handlePluginTitleFocus}
                />
                <SubwaySteps
                    steps={steps}
                    onStepClick={handleSubwayStopClick}
                />
                {completionMessage && (
                    <CompletionMessage asciidoc={completionMessage} />
                )}
                <Modal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    content={modalContent}
                />
            </main>
        </div>
    );
};

export default App;
