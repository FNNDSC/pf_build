import { PF_build, Payload, Query } from "../lib/pf_build";

export async function call_process(
    simulate: boolean,
    method: string,
    headers: Record<string, string>,
    data: Payload,
    baseUrl: string,
): Promise<object> {
    const url = new URL(baseUrl);
    const stepName = url.searchParams.get("step");

    if (!stepName) {
        throw new Error("The 'step' query parameter is missing from the URL.");
    }

    const queryParams: Query = {
        step: stepName,
    };

    const pfBuild = new PF_build(data, queryParams, simulate);

    try {
        const response = await pfBuild.state_do({
            method,
            headers,
            baseUrl,
        });
        return response;
    } catch (error) {
        throw new Error(`Error in call_process: ${error}`);
    }
}
