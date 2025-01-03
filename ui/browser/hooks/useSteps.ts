import { useState } from "react";
import { Step } from "../types/processSteps";
import { StateEnum, StateResponse } from "../lib/stateMapping";

interface UseStepsProps {
    openModal: (
        content: string,
        contentType: "json" | "asciidoc" | "dialog",
    ) => void;
}

export const useSteps = ({ openModal }: UseStepsProps) => {
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

    const [steps, setSteps] = useState<Step[]>(initialSteps);
    const [responses, setResponses] =
        useState<Record<StateEnum, StateResponse | null>>(initialResponses);

    const handleSubwayStopClick = (stepIndex: number): void => {
        const step = steps.find((s) => s.id === stepIndex + 1);
        console.log(
            `in handleSubwayStopClick... stepIndex: ${stepIndex}, step: `,
            step,
        );
        if (step) {
            const response = responses[step.name];
            console.log("response = ", response);
            if (response) {
                openModal(JSON.stringify(response, null, 2), "json"); // Trigger modal with JSON response
            } else {
                openModal(
                    `No response available for step: ${step.name}`,
                    "json",
                );
            }
        }
    };

    const isGitCommitCompleted = steps.some(
        (step) => step.name === "gitCommit" && step.state === "completed",
    );

    return {
        steps,
        responses,
        setSteps,
        setResponses,
        handleSubwayStopClick,
        isGitCommitCompleted,
    };
};
