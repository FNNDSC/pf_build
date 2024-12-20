// types/processSteps.ts

export type StepState = "idle" | "active" | "completed";

export interface Step {
    id: number;
    name: string;
    state: StepState;
}
