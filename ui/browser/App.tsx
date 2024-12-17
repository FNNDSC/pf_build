import React, { useState } from "react";
import { PluginMetadata } from "../types/metadata";
import SubwaySteps, { StepState } from "./components/subwaySteps";
import Modal from "./components/modal";

interface ExtendedPluginMetadata extends PluginMetadata {
    github_token: string;
}

const stepsInitialState = [
    { id: 1, name: "repoExists", state: "idle" as StepState },
    { id: 2, name: "repoCreateInitial", state: "idle" as StepState },
    { id: 3, name: "gitClone", state: "idle" as StepState },
    { id: 4, name: "shellEdit", state: "idle" as StepState },
    { id: 5, name: "shellExec", state: "idle" as StepState },
    { id: 6, name: "gitCommit", state: "idle" as StepState },
];

const App: React.FC = () => {
    const [metadata, setMetadata] = useState<ExtendedPluginMetadata>({
        plugin_title: "",
        scriptname: "",
        description: "",
        organization: "",
        email: "",
        github_token: "",
    });

    const [steps, setSteps] = useState(stepsInitialState);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedStepData, setSelectedStepData] = useState<object | null>(
        null,
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setMetadata((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Metadata Submitted:", metadata);

        // Simulate step progression
        simulateSteps();
    };

    const simulateSteps = async () => {
        for (let i = 0; i < steps.length; i++) {
            setSteps((prevSteps) =>
                prevSteps.map((step, index) =>
                    index === i
                        ? { ...step, state: "active" }
                        : index < i
                          ? { ...step, state: "completed" }
                          : { ...step, state: "idle" },
                ),
            );

            // Simulated JSON return for each step
            const simulatedResponse = {
                step: steps[i].name,
                status: "completed",
                data: { message: `${steps[i].name} successfully completed` },
            };

            console.log(simulatedResponse);

            await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate step delay
        }

        setSteps((prevSteps) =>
            prevSteps.map((step) => ({ ...step, state: "completed" })),
        );
    };

    const handleStepClick = (stepIndex: number) => {
        const step = steps[stepIndex];
        if (step.state === "completed") {
            const simulatedResponse = {
                step: step.name,
                status: "completed",
                data: { message: `${step.name} JSON data` },
            };
            console.log(`Step clicked: ${step.name}`, simulatedResponse);
            setSelectedStepData(simulatedResponse);
            setModalOpen(true);
        }
    };

    return (
        <div style={{ padding: "2rem" }}>
            <h1>ChRIS plugin build factory</h1>
            <p>
                Welcome to the ChRIS plugin build factory. This interface
                automates the process of creating a fully fledged ChRIS plugin.
            </p>
            <p>
                Simply enter values for the fields in this form and hit
                "Submit".
            </p>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="plugin_title"
                    placeholder="Plugin Title"
                    value={metadata.plugin_title}
                    onChange={handleChange}
                />
                <input
                    type="text"
                    name="scriptname"
                    placeholder="Script Name"
                    value={metadata.scriptname}
                    onChange={handleChange}
                />
                <input
                    type="text"
                    name="description"
                    placeholder="Description"
                    value={metadata.description}
                    onChange={handleChange}
                />
                <input
                    type="text"
                    name="organization"
                    placeholder="Organization"
                    value={metadata.organization}
                    onChange={handleChange}
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={metadata.email}
                    onChange={handleChange}
                />
                <input
                    type="password"
                    name="github_token"
                    placeholder="GitHub Personal Access Token"
                    value={metadata.github_token}
                    onChange={handleChange}
                />
                <button type="submit">Submit</button>
            </form>

            <h2>Progress</h2>
            <SubwaySteps
                steps={steps}
                onStepClick={(index) => handleStepClick(index)}
            />

            {/* Modal for step JSON */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                content={selectedStepData}
            />
        </div>
    );
};

export default App;
