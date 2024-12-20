import { fetch as fakeFetch, StateEnum } from "./stateMapping";

interface Payload {
    plugin_title: string;
    scriptname: string;
    description: string;
    organization: string;
    email: string;
    github_token: string;
}

interface Query {
    step: string; // Accepts dynamic step inferred from the URL
}

class PF_build {
    private formValues: Payload;
    private queryParams: Query;
    private useSimulatedFetch: boolean;

    constructor(
        formValues: Payload,
        queryParams: Query,
        useSimulatedFetch = false,
    ) {
        this.formValues = formValues;
        this.queryParams = queryParams;
        this.useSimulatedFetch = useSimulatedFetch;
    }

    async state_do({
        method,
        headers,
        baseUrl,
    }: {
        method: string;
        headers: Record<string, string>;
        baseUrl: string;
    }): Promise<object> {
        const fetchMethod = this.useSimulatedFetch ? fakeFetch : fetch;
        const url = `${baseUrl}`;
        const options = {
            method,
            headers,
            body: JSON.stringify(this.formValues),
        };

        try {
            const response = await fetchMethod(url, options);
            return response;
        } catch (error) {
            throw new Error(
                `Error executing step '${this.queryParams.step}': ${error}`,
            );
        }
    }
}

export { PF_build, Payload, Query };
