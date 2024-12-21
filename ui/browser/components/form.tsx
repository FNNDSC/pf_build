import React from "react";

interface FormProps {
    formValues: Record<string, string>;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    onFocusPluginTitle: () => void; // New prop for handling plugin_title focus
}

const Form: React.FC<FormProps> = ({
    formValues,
    onChange,
    onSubmit,
    onFocusPluginTitle,
}) => {
    const getFieldExplanation = (field: string): string => {
        const explanations: Record<string, string> = {
            plugin_title:
                "Provide a title for all the files constituting this project. By convention this is a single string typically prefixed with 'pl-', e.g., 'pl-brainSurfaceAnalysis'.",
            scriptname:
                "Specify the Python script name for this plugin. This is the main code file of your project, e.g. 'brainSurfaceAnalysis'. Do not append a trailing .py",
            description:
                "Briefly describe the plugin's functionality. For example, 'This application finds areas of high curvature on a brain surface mesh reconstruction.'",
            organization:
                "Enter your organization's name, e.g. Boston Children's Hospital.",
            email: "Your email address.",
            github_token:
                "Your GitHub Personal Access Token. Only necessary if you want this project to exist in the repo associated by the token and be owned by the associated user.",
            service_url:
                "The web endpoint controlling this process. You typically won't need to change this.",
        };
        return explanations[field] || "";
    };

    return (
        <form onSubmit={onSubmit} className="padded-form">
            <h2>Factory Details</h2>
            <div className="form-row faded">
                <label htmlFor="service_url" className="form-label">
                    Service URL:
                </label>
                <div className="form-input-container">
                    <input
                        id="service_url"
                        name="service_url"
                        type="text"
                        value={formValues.service_url}
                        onChange={onChange}
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
                        className={`form-row ${key === "github_token" ? "faded" : ""}`}
                    >
                        <label htmlFor={key} className="form-label">
                            {key
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (char) => char.toUpperCase())}
                            :
                        </label>
                        <div className="form-input-container">
                            <input
                                id={key}
                                name={key}
                                type={
                                    key === "github_token" ? "password" : "text"
                                }
                                value={value}
                                onChange={onChange}
                                onFocus={
                                    key === "plugin_title"
                                        ? onFocusPluginTitle
                                        : undefined
                                } // Apply focus handler to plugin_title
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
    );
};

export default Form;
