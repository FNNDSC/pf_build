import { useState } from "react";

export const useFormState = () => {
    const initialFormValues = {
        plugin_title: "",
        scriptname: "",
        description: "",
        organization: "",
        email: "",
        github_token: "",
        service_url: "http://localhost:8000",
    };

    const [formValues, setFormValues] = useState(initialFormValues);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target;
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    return {
        formValues,
        setFormValues,
        handleChange,
    };
};

