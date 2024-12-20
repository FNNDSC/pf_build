import React from "react";
import "../styles/subwaySteps.css";
import { Step, StepState } from "../types/processSteps";

interface SubwayStepsProps {
    steps: Step[];
    onStepClick: (index: number) => void;
}

const SubwaySteps: React.FC<SubwayStepsProps> = ({ steps, onStepClick }) => {
    return (
        <div className="subway-container">
            {steps.map((step, index) => (
                <div
                    key={step.id}
                    className="subway-step-wrapper"
                    onClick={() => {
                        if (step.state === "completed") onStepClick(index);
                    }}
                    style={{
                        cursor:
                            step.state === "completed" ? "pointer" : "default",
                    }}
                >
                    {/* Step Circle */}
                    <div
                        className={`subway-step ${step.state}`}
                        aria-label={`Step ${step.id}: ${step.name}`}
                    >
                        {step.id}
                    </div>
                    {/* Step Label */}
                    <div className="subway-step-text">{step.name}</div>
                </div>
            ))}
        </div>
    );
};

export default SubwaySteps;
