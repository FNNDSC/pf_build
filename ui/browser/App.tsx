import React, { useState } from "react";
import Form from "./components/form";
import SubwaySteps from "./components/subwaySteps";
import Modal from "./components/modal";
import { useSteps } from "./hooks/useSteps";
import { useModal } from "./components/modalContext";
import { usePageReset } from "./hooks/usePageReset";
import { useModalHandlers } from "./hooks/useModalHandlers";
import { AppLayout } from "./components/appLayout";
import "./styles/styles.css";
import useFormHandlers from "./hooks/useFormHandlers";

const App: React.FC = () => {
    const { formValues, setFormValues, handleChange, handleSubmit } =
        useFormHandlers();
    const { openModal, closeModal } = useModal();
    const [completionMessage, setCompletionMessage] = useState<string | null>(
        null,
    );

    const {
        steps,
        responses,
        setSteps,
        setResponses,
        handleSubwayStopClick,
        isGitCommitCompleted,
    } = useSteps({ openModal });

    const { resetPage } = usePageReset({
        setFormValues,
        setSteps,
        setResponses,
        closeModal,
        setCompletionMessage,
    });

    const { handleNextStepsClick, handlePluginTitleFocus } = useModalHandlers({
        openModal,
        completionMessage,
        responses,
        resetPage,
    });

    return (
        <AppLayout>
            <Form
                formValues={formValues}
                onChange={handleChange}
                onSubmit={(e) =>
                    handleSubmit(
                        e,
                        steps,
                        setSteps,
                        setResponses,
                        openModal,
                        setCompletionMessage,
                    )
                }
                onFocusPluginTitle={handlePluginTitleFocus}
            />
            <SubwaySteps steps={steps} onStepClick={handleSubwayStopClick} />
            {isGitCommitCompleted && (
                <button className="form-submit" onClick={handleNextStepsClick}>
                    Next Steps
                </button>
            )}
            <Modal onResetForm={resetPage} />
        </AppLayout>
    );
};

export default App;
