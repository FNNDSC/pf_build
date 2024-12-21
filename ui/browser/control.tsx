import { Step } from "../types/processSteps";
import { StateEnum, StateResponse } from "../lib/stateMapping";
import { fetch } from "../lib/stateMapping";

/**
 * Generates an AsciiDoc completion message for the `gitCommit` step.
 */
const generateCompletionMessage = (
    response: StateResponse,
    scriptName: string,
): string => {
    return `
= Success

Congratulations! Your new ChRIS plugin called \`${response.gitCommit.repo_name}\` has been successfully created and is ready for checkout and further development.

== Check out the repo:

First, \`cd\` to a directory on your local computer — typically one you might use for coding.

----
# For example...
cd ~/src
----

Now, check out the created repo:

----
gh repo clone ${response.gitCommit.repo_url}
----

== Initialize and setup

Now, \`cd\` into the repo:

----
cd ${response.gitCommit.repo_name}
----

and run:

----
uv venv
----

followed by 

----
source .venv/bin/activate
----

Install any requirements:

----
uv pip install -r requirements.txt
----

and prep your application:

----
uv pip install -e ./ 
----

This allows you to simply run the script directly and any code changes are immediately reflected in the application.

== Start coding!

You can immediately start coding on your main program \`${scriptName}.py\`.
  `;
};

/**
 * Displays a final AsciiDoc message if the last step `gitCommit` is completed successfully.
 */
export const finalMessage_checkAndShow = (
    step: Step,
    response: StateResponse,
    setCompletionMessage: React.Dispatch<React.SetStateAction<string | null>>,
    scriptName: string,
): void => {
    if (
        step.name === "gitCommit" &&
        response.status === true &&
        response.gitCommit?.repo_url
    ) {
        const asciidocMessage = generateCompletionMessage(response, scriptName);
        setCompletionMessage(asciidocMessage);
    }
};

/**
 * Executes the pipeline of steps sequentially, managing state transitions and API interactions.
 */
export const executeStates = async (
    formValues: Record<string, string>,
    steps: Step[],
    setSteps: React.Dispatch<React.SetStateAction<Step[]>>,
    setResponses: React.Dispatch<
        React.SetStateAction<Record<StateEnum, StateResponse | null>>
    >,
    setCompletionMessage: React.Dispatch<React.SetStateAction<string | null>>,
): Promise<void> => {
    const scriptName = formValues.scriptname; // Use scriptname directly from formValues

    for (const step of steps) {
        // Set the current step to active
        setSteps((prev) =>
            prev.map((s) =>
                s.name === step.name ? { ...s, state: "active" } : s,
            ),
        );

        try {
            const url = `${formValues.service_url}/api/vi/bootstrap/?step=${step.name}`;
            console.log(`Executing step '${step.name}' with URL: ${url}`);

            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formValues),
            });

            console.log(`Response for step '${step.name}':`, response);

            // Update responses and mark the step as completed
            setResponses((prev) => ({ ...prev, [step.name]: response }));
            setSteps((prev) =>
                prev.map((s) =>
                    s.name === step.name ? { ...s, state: "completed" } : s,
                ),
            );

            // Check for final message condition
            finalMessage_checkAndShow(
                step,
                response,
                setCompletionMessage,
                scriptName,
            );
        } catch (error) {
            console.error(`Error during step '${step.name}':`, error);
            // Reset the state of the current step to idle on failure
            setSteps((prev) =>
                prev.map((s) =>
                    s.name === step.name ? { ...s, state: "idle" } : s,
                ),
            );
            break;
        }
    }
};
