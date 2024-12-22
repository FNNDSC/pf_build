import React from "react";

const FormHeader: React.FC = () => {
    return (
        <>
            <h2>Factory Details</h2>
            <p className="form-intro">
                Welcome to the ChRIS Plugin Factory! Fill in the fields below to
                get started with creating your plugin.
            </p>
            <h2>Plugin Metadata</h2>
        </>
    );
};

export default FormHeader;
