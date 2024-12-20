import { Payload } from "./pf_build";

type StateEnum =
    | "repoExists"
    | "repoCreateInitial"
    | "gitClone"
    | "shellEdit"
    | "shellExec"
    | "gitCommit";

interface BootstrapBase {
    TIMESTAMP_FORMAT: string;
    status: boolean;
    message: string;
    starttime: string;
    endtime: string;
}

interface StateResponse extends BootstrapBase {
    repoExists: RepoExistsDetails | null;
    repoCreateInitial: RepoCreateInitialDetails | null;
    gitClone: GitCloneDetails | null;
    shellEdit: ShellEditDetails | null;
    shellExec: ShellExecDetails | null;
    gitCommit: GitCommitDetails | null;
}

interface RepoExistsDetails extends BootstrapBase {
    repo_name: string;
}

interface RepoCreateInitialDetails extends BootstrapBase {
    repo_name: string;
    repo_created: boolean;
    repo_url: string;
}

interface GitCloneDetails extends BootstrapBase {
    repo_url: string;
    clone_path: string;
    branch: string;
}

interface ShellEditDetails extends BootstrapBase {
    script_path: string;
    changes_made: string[];
}

interface ShellExecDetails extends BootstrapBase {
    result: {
        stdout: string;
        stderr: string;
        returncode: number;
    };
}

interface GitCommitDetails extends BootstrapBase {
    repo_name: string;
    repo_url: string;
    clone_path: string;
    branch: string;
}

class StateMappingGenerator {
    static getCurrentTimestamp(): string {
        return new Date().toISOString().replace(/T/, "_").replace(/\..+/, "");
    }

    static generate(pluginTitle: string): StateResponse {
        const currentTime = this.getCurrentTimestamp();
        return {
            TIMESTAMP_FORMAT: "%Y-%m-%d_%H:%M:%S",
            status: true,
            message: "",
            starttime: currentTime,
            endtime: currentTime,
            repoExists: null,
            repoCreateInitial: null,
            gitClone: null,
            shellEdit: null,
            shellExec: null,
            gitCommit: null,
        };
    }

    static populateStep(step: StateEnum, options: FetchOptions): StateResponse {
        const payload: Payload = JSON.parse(options.body);
        const pluginTitle: string = payload.plugin_title;
        const baseResponse = this.generate(pluginTitle);
        const stepStartTime = this.getCurrentTimestamp();
        const stepEndTime = this.getCurrentTimestamp();
        if (!pluginTitle) {
            throw new Error("Invalid payload: Missing 'plugin_title'.");
        }

        switch (step) {
            case "repoExists":
                baseResponse.repoExists = {
                    TIMESTAMP_FORMAT: "%Y-%m-%d_%H:%M:%S",
                    status: true,
                    message: `Repository ${pluginTitle} does not exist or not found.`,
                    starttime: stepStartTime,
                    endtime: stepEndTime,
                    repo_name: pluginTitle,
                };
                break;
            case "repoCreateInitial":
                baseResponse.repoCreateInitial = {
                    TIMESTAMP_FORMAT: "%Y-%m-%d_%H:%M:%S",
                    status: true,
                    message: `Repository ${pluginTitle} created successfully.`,
                    starttime: stepStartTime,
                    endtime: stepEndTime,
                    repo_name: pluginTitle,
                    repo_created: true,
                    repo_url: `https://github.com/FNNDSC/${pluginTitle}.git`,
                };
                break;
            case "gitClone":
                baseResponse.gitClone = {
                    TIMESTAMP_FORMAT: "%Y-%m-%d_%H:%M:%S",
                    status: true,
                    message: `Repository cloned successfully.`,
                    starttime: stepStartTime,
                    endtime: stepEndTime,
                    repo_url: `https://github.com/FNNDSC/${pluginTitle}.git`,
                    clone_path: `/home/appuser/repositories/${pluginTitle}`,
                    branch: "main",
                };
                break;
            case "shellEdit":
                baseResponse.shellEdit = {
                    TIMESTAMP_FORMAT: "%Y-%m-%d_%H:%M:%S",
                    status: true,
                    message: `Shell script updated for ${pluginTitle}.`,
                    starttime: stepStartTime,
                    endtime: stepEndTime,
                    script_path: `/home/appuser/repositories/${pluginTitle}/bootstrap.sh`,
                    changes_made: [
                        `PLUGIN_TITLE='${payload.plugin_title}'`,
                        `SCRIPT_NAME='${payload.scriptname}'`,
                        `DESCRIPTION='${payload.description}'`,
                        `EMAIL='${payload.email}'`,
                        "READY=YES",
                    ],
                };
                break;
            case "shellExec":
                baseResponse.shellExec = {
                    TIMESTAMP_FORMAT: "%Y-%m-%d_%H:%M:%S",
                    status: true,
                    message: `Execution logs available for ${pluginTitle}.`,
                    starttime: stepStartTime,
                    endtime: stepEndTime,
                    result: {
                        stdout: "Execution logs...",
                        stderr: "",
                        returncode: 0,
                    },
                };
                break;
            case "gitCommit":
                baseResponse.gitCommit = {
                    TIMESTAMP_FORMAT: "%Y-%m-%d_%H:%M:%S",
                    status: true,
                    message: `Changes committed and pushed to ${pluginTitle}.`,
                    starttime: stepStartTime,
                    endtime: stepEndTime,
                    repo_name: pluginTitle,
                    repo_url: `https://github.com/FNNDSC/${pluginTitle}.git`,
                    clone_path: `/home/appuser/repositories/${pluginTitle}`,
                    branch: "main",
                };
                break;
        }
        return baseResponse;
    }
}

interface FetchOptions {
    method: string;
    headers: Record<string, string>;
    body: string;
}

async function fetch(
    url: string,
    options: FetchOptions,
): Promise<StateResponse> {
    const step: StateEnum | null = new URL(
        url,
        "http://localhost",
    ).searchParams.get("step") as StateEnum | null;

    if (!step) {
        throw new Error("Invalid URL: Missing 'step' parameter.");
    }
    const response: StateResponse = StateMappingGenerator.populateStep(
        step,
        options,
    );

    return new Promise((resolve: (value: StateResponse) => void) =>
        setTimeout(() => resolve(response), 1000),
    );
}

export { StateEnum, StateResponse, StateMappingGenerator, fetch };
