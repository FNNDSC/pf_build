import React from "react";

interface FormBodyProps {
    formValues: Record<string, string>;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onFocus?: (field: string) => void; // Optional for handling field-specific focus events
}

const FormBody: React.FC<FormBodyProps> = ({
    formValues,
    onChange,
    onFocus,
}) => {
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
        <>
            {Object.entries(formValues).map(([key, value]) => (
                <div
                    key={key}
                    className={`form-row ${key === "github_token" || key === "service_url" ? "faded" : ""}`}
                >
                    <label htmlFor={key} className="form-label">
                        {key
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (char) => char.toUpperCase())}
                        :
                    </label>
                    <div className="form-input-container">
                        <input
                            type={key === "github_token" ? "password" : "text"}
                            id={key}
                            name={key}
                            placeholder={key}
                            value={value}
                            onChange={onChange}
                            onFocus={() => onFocus && onFocus(key)}
                            className="form-input"
                        />
                        <p className="form-help-text">
                            {getFieldExplanation(key)}
                        </p>
                    </div>
                </div>
            ))}
        </>
    );
};

export default FormBody;
