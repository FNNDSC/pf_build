import React, { useState } from "react";
import { StateEnum, StateResponse } from "../lib/stateMapping";
import { fetch } from "../lib/stateMapping";
import SubwaySteps from "./components/subwaySteps";
import Modal from "./components/modal";
import logo from "../images/ChRISlogo-color.svg";
import "./styles/styles.css";

const App: React.FC = () => {
    const [formValues, setFormValues] = useState({
        plugin_title: "",
        scriptname: "",
        description: "",
        organization: "",
        email: "",
        github_token: "",
        service_url: "http://localhost:8000", // Default or user-provided service URL
    });

    const [steps, setSteps] = useState([
        { id: 1, name: "repoExists", state: "idle" },
        { id: 2, name: "repoCreateInitial", state: "idle" },
        { id: 3, name: "gitClone", state: "idle" },
        { id: 4, name: "shellEdit", state: "idle" },
        { id: 5, name: "shellExec", state: "idle" },
        { id: 6, name: "gitCommit", state: "idle" },
    ] as {
        id: number;
        name: StateEnum;
        state: "idle" | "active" | "completed";
    }[]);

    const [responses, setResponses] = useState<
        Record<StateEnum, StateResponse | null>
    >({
        repoExists: null,
        repoCreateInitial: null,
        gitClone: null,
        shellEdit: null,
        shellExec: null,
        gitCommit: null,
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<object | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target;
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        console.log("Form submitted with values:", formValues);
        await executeStates();
    };

    const executeStates = async (): Promise<void> => {
        for (const step of steps) {
            setSteps((prev) =>
                prev.map((s) =>
                    s.name === step.name ? { ...s, state: "active" } : s,
                ),
            );

            try {
                const url = `${formValues.service_url}/api/vi/bootstrap/?step=${step.name}`;
                console.log(`Executing step '${step.name}' with URL: ${url}`);

                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formValues),
                });

                console.log(`Response for step '${step.name}':`, response);

                setResponses((prev) => ({ ...prev, [step.name]: response }));
                setSteps((prev) =>
                    prev.map((s) =>
                        s.name === step.name ? { ...s, state: "completed" } : s,
                    ),
                );
            } catch (error) {
                console.error(`Error during step '${step.name}':`, error);
                break;
            }
        }
    };

    const handleSubwayStopClick = (stepIndex: number): void => {
        const step = steps.find((s) => s.id === stepIndex + 1); // Adjust for zero-based index
        if (step) {
            const stepName = step.name;
            const response = responses[stepName];
            if (response) {
                setModalContent((prev) =>
                    prev === response ? null : { ...response, step: stepName },
                );
                setModalOpen((prev) => !prev);
            }
        }
    };

    const getFieldExplanation = (field: string): string => {
        const explanations: Record<string, string> = {
            plugin_title:
                "Provide a title for this project and all its files. By convention, this title is prefixed with 'pl-', e.g., 'pl-brainSurfaceAnalysis'.",
            scriptname:
                "Specify the Python script name for this plugin. This will be the file you can start to edit when you clone this repository, e.g., brainSurfaceAnalysis.",
            description:
                "Briefly describe the plugin's functionality in a sentence, e.g., 'This plugin determines areas of high curvature on a brain surface mesh reconstruction.'",
            organization:
                "Enter your organization's name, e.g., Boston Children's Hospital.",
            email: "Your email address.",
            github_token:
                "Enter your GitHub Personal Access Token. Only required if you want this built in your personal GitHub account.",
            service_url:
                "The Service URL is the web endpoint controlling this process. Usually, no changes are needed.",
        };
        return explanations[field] || "";
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
                <form onSubmit={handleSubmit} className="padded-form">
                    <h2>Factory Details</h2>
                    <div className="form-row faded">
                        <label htmlFor="service_url" className="form-label">
                            Service URL:
                        </label>
                        <div className="form-input-container">
                            <input
                                type="text"
                                id="service_url"
                                name="service_url"
                                placeholder="Service URL"
                                value={formValues.service_url}
                                onChange={handleChange}
                                className="form-input"
                            />
                            <p className="form-help-text">
                                {getFieldExplanation("service_url")}
                            </p>
                        </div>
                    </div>
                    <h2>Plugin Meta Data</h2>
                    {Object.entries(formValues)
                        .filter(([key]) => key !== "service_url")
                        .map(([key, value]) => (
                            <div
                                key={key}
                                className={`form-row ${
                                    key === "github_token" ? "faded" : ""
                                }`}
                            >
                                <label htmlFor={key} className="form-label">
                                    {key
                                        .replace(/_/g, " ")
                                        .replace(/\b\w/g, (char) =>
                                            char.toUpperCase(),
                                        )}
                                    :
                                </label>
                                <div className="form-input-container">
                                    <input
                                        type={
                                            key === "github_token"
                                                ? "password"
                                                : "text"
                                        }
                                        id={key}
                                        name={key}
                                        placeholder={key}
                                        value={value}
                                        onChange={handleChange}
                                        className="form-input"
                                    />
                                    <p className="form-help-text">
                                        {getFieldExplanation(key)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    <button type="submit" className="form-submit">
                        Submit
                    </button>
                </form>
                <SubwaySteps
                    steps={steps}
                    onStepClick={handleSubwayStopClick}
                />
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
