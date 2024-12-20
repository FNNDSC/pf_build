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
        console.log(`Subway stop clicked for index '${stepIndex}'`);
        const step = steps.find((s) => s.id === stepIndex + 1); // Adjust for zero-based index

        if (step) {
            const stepName = step.name;

            // Toggle modal if clicking the same stop
            if (
                modalOpen &&
                modalContent &&
                (modalContent as any).step === stepName
            ) {
                console.log(`Toggling off modal for step '${stepName}'`);
                setModalOpen(false);
                setModalContent(null);
                return;
            }

            const response = responses[stepName];
            console.log(`Resolved step name: '${stepName}'`);

            if (response) {
                console.log(
                    `Displaying response for step '${stepName}':`,
                    response,
                );
                setModalContent({ ...response, step: stepName }); // Add step name to content for comparison
                setModalOpen(true);
            } else {
                console.warn(`No response available for step: ${stepName}`);
            }
        } else {
            console.error(`No step found for index: ${stepIndex}`);
        }
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <img src={logo} alt="ChRIS Logo" className="app-logo" />
                <h1 className="header-title">ChRIS Plugin Factory</h1>
            </header>
            <main className="app-content">
                <form onSubmit={handleSubmit} className="padded-form">
                    <h2>Factory Details</h2>
                    <div className="form-row">
                        <label htmlFor="service_url" className="form-label">
                            Service URL:
                        </label>
                        <input
                            type="text"
                            id="service_url"
                            name="service_url"
                            placeholder="Service URL"
                            value={formValues.service_url}
                            onChange={handleChange}
                            className="form-input"
                        />
                    </div>
                    <h2>Plugin Meta Data</h2>
                    {Object.keys(formValues)
                        .filter((key) => key !== "service_url")
                        .map((key) => (
                            <div key={key} className="form-row">
                                <label htmlFor={key} className="form-label">
                                    {key
                                        .replace(/_/g, " ")
                                        .replace(/\b\w/g, (char) =>
                                            char.toUpperCase(),
                                        )}
                                    :
                                </label>
                                <input
                                    type={
                                        key === "github_token"
                                            ? "password"
                                            : "text"
                                    }
                                    id={key}
                                    name={key}
                                    placeholder={key}
                                    value={(formValues as any)[key]}
                                    onChange={handleChange}
                                    className="form-input"
                                />
                            </div>
                        ))}
                    <button type="submit" className="form-submit">
                        Submit
                    </button>
                </form>
                <SubwaySteps
                    steps={steps}
                    onStepClick={(stepIndex: number) =>
                        handleSubwayStopClick(stepIndex)
                    }
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
