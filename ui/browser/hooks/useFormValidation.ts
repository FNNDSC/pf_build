import { useModal } from "../components/modalContext";

export interface ValidationCondition {
    check: (value: string) => boolean;
    message: string;
    autoFail: boolean;
}

export const useFormValidation = () => {
    const { openModal, closeModal } = useModal();

    const validateField = (
        value: string,
        conditions: ValidationCondition[],
        onEdit: () => void,
    ): Promise<boolean> => {
        return new Promise((resolve) => {
            for (const condition of conditions) {
                if (!condition.check(value)) {
                    openModal(condition.message, "validation", {
                        validation: {
                            onEdit: () => {
                                closeModal();
                                onEdit();
                                resolve(false);
                            },
                            canContinue: !condition.autoFail,
                        },
                        onConfirm: () => {
                            closeModal();
                            resolve(true);
                        },
                    });
                    return;
                }
            }
            resolve(true);
        });
    };

    const validatePluginTitle = (
        value: string,
        onEdit: () => void,
    ): Promise<boolean> => {
        const conditions: ValidationCondition[] = [
            {
                check: (v) => !v.includes(" "),
                message: "Plugin title cannot contain spaces",
                autoFail: true,
            },
            {
                check: (v) => v.startsWith("pl-"),
                message: "Plugin title should start with pl-",
                autoFail: false,
            },
            {
                check: (v) => v.length < 20,
                message: "Plugin title must be less than 20 characters",
                autoFail: true,
            },
        ];

        return validateField(value, conditions, onEdit);
    };

    return {
        validateField,
        validatePluginTitle,
    };
};
