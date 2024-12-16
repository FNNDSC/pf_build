import asyncio

from app.utils.file import bootstrapScript_edit
from app.utils.jobController import JobResult, Jobber
from app.utils.github import GithubRepoUtil
from app.models.bootstrapModel import (
    BootstrapModel,
    BootstrapState,
    BootstrapStep,
    BootstrapStepBase,
    GithubRepoExists,
    GitCloneResponse,
    ShellEditStep,
    ShellExecStep,
    GitCommitResponse,
    GithubRepoCreate,
    GithubRepoCheck as GithubCheckModel,
)
from typing import Tuple, Callable, Awaitable, TypeVar
import sys
import os
import re
import pudb
from pudb.remote import set_trace
from app.config import settings
import json
from typing import Optional
from pydantic import TypeAdapter
from loguru import logger
from app.config.settings import appData
from github import Github
from pathlib import Path
import time
from datetime import datetime

logger_format = (
    "<green>{time:YYYY-MM-DD HH:mm:ss}</green> │ "
    "<level>{level: <5}</level> │ "
    "<yellow>{name: >28}</yellow>::"
    "<cyan>{function: <30}</cyan> @"
    "<cyan>{line: <4}</cyan> ║ "
    "<level>{message}</level>"
)
logger.remove()
logger.opt(colors=True)
logger.add(sys.stderr, format=logger_format)
LOG = logger.info


def noop():
    """
    A dummy function that does nothing.
    """
    return {"status": True}


def winToNix_path(cmd: str) -> str:
    """
    Any cmd from the client that contains a windows style '\\'
    has this replaced with '/'
    """
    return re.sub(r"\\(?!\\)", "/", cmd)


async def bootstrap_repoExists(
    values: BootstrapModel, github_client: Github
) -> GithubRepoExists:
    """
    Check if a repository exists using the provided GitHub client.

    Args:
        values (BootstrapModel): The bootstrap values provided.
        github_client (Github): The GitHub client instance.

    Returns:
        GithubRepoExists: Result of the repository existence check.
    """
    # pudb.set_trace()
    result: GithubRepoExists = await GithubRepoUtil.repo_checkExists(
        github_client=github_client,  # Pass the dynamic GitHub client
        repo_name=values.plugin_title,
        org_name=values.organization,
    )
    result.end_stamp()
    return result


async def poll_repo_availability(
    github_client: Github, repo_name: str, org_name: str, timeout: int = 30
) -> bool:
    """
    Polls GitHub to check if a repository is available.

    Args:
        github_client (Github): Authenticated GitHub client.
        repo_name (str): Name of the repository to check.
        org_name (str): Name of the organization owning the repository.
        timeout (int): Maximum time to wait for the repository (in seconds).

    Returns:
        bool: True if the repository is available, False if timeout occurs.
    """
    elapsed_time: int = 0
    interval: int = 5  # Poll every 5 seconds

    while elapsed_time < timeout:
        try:
            org = github_client.get_organization(org_name)
            repo = org.get_repo(repo_name)
            if repo:  # If the repository exists and is accessible
                return True
        except Exception as e:
            logger.info(f"Waiting for repository {repo_name} to be available: {str(e)}")
            await asyncio.sleep(interval)  # Use asyncio.sleep for async compatibility
            elapsed_time += interval

    # Timeout occurred
    logger.error(f"Repository {repo_name} not available after {timeout} seconds.")
    return False


async def bootstrap_repoCreateInitial(
    values: BootstrapModel, github_client: Github
) -> GithubRepoCreate:
    """
    Create initial repository from a template using the provided GitHub client and
    ensure the repository is available before proceeding.

    Args:
        values (BootstrapModel): The bootstrap values provided.
        github_client (Github): The GitHub client instance.

    Returns:
        GithubRepoCreate: Result of the repository creation process.
    """
    result: GithubRepoCreate = await GithubRepoUtil.repo_createFromTemplate(
        github_client=github_client,  # Pass the dynamic GitHub client
        repo_name=values.plugin_title,
        description=values.description,
        org_name=values.organization,
    )

    if not result.status:
        # If repository creation failed, return the failure response
        return result

    # Poll for repository availability
    repo_available: bool = await poll_repo_availability(
        github_client=github_client,
        repo_name=values.plugin_title,
        org_name=values.organization,
    )

    if not repo_available:
        return GithubRepoCreate(
            status=False,
            message=f"Repository {values.plugin_title} was created but is not available.",
            repo_name=values.plugin_title,
            repo_created=False,
        )

    return result


async def bootstrap_gitClone(
    values: BootstrapModel, github_client: Github
) -> GitCloneResponse:
    """
    Clone the newly created repository using the provided GitHub client.

    Args:
        values (BootstrapModel): The bootstrap values provided.
        github_client (Github): The GitHub client instance.

    Returns:
        GitCloneResponse: Result of the repository cloning process.
    """
    result = await GithubRepoUtil.repo_clone(
        github_client=github_client,  # Pass the provided GitHub client
        repo_name=values.plugin_title,
        org_name=values.organization,
    )

    return result


async def bootstrap_shellEdit(
    values: BootstrapModel, github_client: Github
) -> ShellEditStep:
    """
    Edit shell script with bootstrap values.

    Args:
        values (BootstrapModel): The bootstrap values provided.
        github_client (Github): The GitHub client instance.

    Returns:
        ShellEditStep: Result of the shell editing process.
    """
    # pudb.set_trace()
    script_path: Path = appData.appRepoLocalPath / values.plugin_title / "bootstrap.sh"
    changes_made: list[str] = bootstrapScript_edit(script_path, values)

    return ShellEditStep(
        status=True,
        message="Shell script edited successfully",
        script_path=str(script_path),
        changes_made=changes_made,
    )


def git_configure(
    values: BootstrapModel, jobber: Jobber, github_client: Github
) -> ShellExecStep:
    """
    Configures Git with the given settings dynamically based on the authenticated user.

    Args:
        values (BootstrapModel): Bootstrap model containing Git configuration values.
        jobber (Jobber): The job runner instance.
        github_client (Github): The GitHub client instance.

    Returns:
        ShellExecStep: Result of the configuration process.
    """
    try:
        # Fetch authenticated user details from GitHub client
        user = github_client.get_user()
        git_settings = {
            "user.name": user.login,
            "user.email": user.email
            or values.email,  # Fallback to values.email if API returns None
        }

        for key, value in git_settings.items():
            cmd: str = f"git config --global {key} '{value}'"
            result: JobResult = jobber.job_run(cmd)
            if result.returncode != 0:
                return ShellExecStep(
                    status=False,
                    message=f"Failed to set Git {key}: {result.stderr}",
                    result=result,
                )

        return ShellExecStep(
            status=True,
            message="Successfully configured Git",
            result=JobResult(
                cmd="",
                cwd="",
                returncode=0,
                stderr="",
                stdout="Git configured successfully.",
            ),
        )
    except Exception as e:
        return ShellExecStep(
            status=False,
            message=f"Exception during Git configuration: {str(e)}",
            result=JobResult(
                cmd="",
                cwd="",
                returncode=-1,
                stderr=str(e),
                stdout="",
            ),
        )


def script_addCommit(
    repo_path: Path, script_name: str, jobber: Jobber
) -> ShellExecStep:
    """
    Adds and commits the generated script to the Git repository.

    Args:
        repo_path (Path): Path to the repository.
        script_name (str): Name of the script to add and commit.
        jobber (Jobber): The job runner instance.

    Returns:
        ShellExecStep: Result of the commit operation.
    """
    commands: list[tuple[str, str]] = [
        (f"git add {script_name}", "Failed to add file"),
        ('git commit -m "Add app"', "Failed to commit file"),
    ]

    result: JobResult = JobResult(
        cmd="", cwd=str(repo_path), returncode=0, stderr="", stdout=""
    )

    original_cwd: Path = Path.cwd()
    try:
        os.chdir(repo_path)
        for cmd, error_message in commands:
            cmd: str
            error_message: str
            result = jobber.job_run(cmd)
            if result.returncode != 0:
                return ShellExecStep(
                    status=False,
                    message=f"{error_message}: {result.stderr}",
                    result=result,
                )
    finally:
        os.chdir(original_cwd)

    return ShellExecStep(
        status=True,
        message="Successfully added and committed the script",
        result=result,
    )


async def bootstrap_shellExec(
    values: BootstrapModel, github_client: Github
) -> ShellExecStep:
    """
    Executes shell commands to configure Git, run bootstrap.sh, and add/commit the generated script.

    Args:
        values (BootstrapModel): The bootstrap values provided.
        github_client (Github): The GitHub client instance.

    Returns:
        ShellExecStep: Result of the bootstrap.sh execution.
    """
    try:
        # Create a Jobber instance using the GitHub client token
        jobber: Jobber = Jobber({"github_client": github_client})

        # Configure Git settings
        configure_result: ShellExecStep = git_configure(values, jobber, github_client)
        if not configure_result.status:
            return configure_result

        # Execute bootstrap.sh
        bootstrap_script_path: Path = (
            Path.home() / "repositories" / values.plugin_title / "bootstrap.sh"
        )
        script_result: JobResult = jobber.job_run(f"bash {bootstrap_script_path}")

        if script_result.returncode != 0:
            return ShellExecStep(
                status=False,
                message="Execution of bootstrap.sh failed",
                result=script_result,
            )

        # Add and commit the generated script
        repo_path: Path = Path.home() / "repositories" / values.plugin_title
        add_commit_result: ShellExecStep = script_addCommit(
            repo_path, f"{values.scriptname}.py", jobber
        )

        if not add_commit_result.status:
            return add_commit_result

        return ShellExecStep(
            status=True,
            message="Successfully executed bootstrap.sh",
            result=script_result,
        )
    except Exception as e:
        e: Exception
        return ShellExecStep(
            status=False,
            message=f"Exception occurred: {str(e)}",
            result=JobResult(
                cmd="",
                cwd=os.getcwd(),
                returncode=-1,
                stderr=str(e),
                stdout="",
            ),
        )


async def bootstrap_gitCommit(
    values: BootstrapModel, github_client: Github
) -> GitCommitResponse:
    """
    Commit changes in the cloned repository and push them to the remote.

    Args:
        values (BootstrapModel): The bootstrap values provided.
        github_client (Github): The GitHub client instance.

    Returns:
        GitCommitResponse: Result of the commit and push operation.
    """
    # pudb.set_trace()
    try:
        repo_name: str = values.plugin_title
        org_name: str = values.organization
        base_dir: Path = Path.home() / "repositories" / repo_name

        githubtoken: str | None = appData.githubToken_get()
        token: str = githubtoken if githubtoken else ""

        # Perform the commit and push operation
        result: GitCommitResponse = await GithubRepoUtil.repo_commit(
            github_client=github_client,
            token=token,
            repo_name=repo_name,
            org_name=org_name,
            base_dir=base_dir,
        )
        return result
    except Exception as e:
        error_message: str = f"Exception during 'gitCommit' operation: {str(e)}"
        logger.error(f"Error in 'bootstrap_gitCommit': {error_message}")
        return GitCommitResponse(status=False, message=error_message, details=None)


async def bootstrap_exec(
    values: BootstrapModel, step: BootstrapStep, token: Optional[str] = None
) -> BootstrapState:
    """
    Execute the bootstrap process for the specified step(s) or all.

    Args:
        values (BootstrapModel): The bootstrap values provided.
        step (BootstrapStep): The step to execute.
        token (Optional[str]): Optional GitHub token to override the default.

    Returns:
        BootstrapState: The state of all steps after execution.
    """
    # pudb.set_trace()
    state: BootstrapState = BootstrapState()
    state.start_stamp()
    # Define the correct dependency order
    ordered_steps: list[BootstrapStep] = [
        BootstrapStep.REPO_EXISTS,
        BootstrapStep.REPO_CREATE,
        BootstrapStep.REPO_CLONE,
        BootstrapStep.SCRIPT_EDIT,
        BootstrapStep.SCRIPT_EXEC,
        BootstrapStep.GIT_COMMIT,
    ]

    steps: list[BootstrapStep] = (
        [step]
        if step != BootstrapStep.ALL
        else [s for s in ordered_steps if s != BootstrapStep.ALL]
    )

    appData.githubToken = ""
    github_client: Optional[Github] = state.initialize_github_client(token)
    if github_client is None:
        state.handle_error(
            "GitHub client could not be initialized. Check the token or configuration."
        )
        return state

    single_step: bool = len(steps) == 1  # Determine if this is a single-step execution

    for current in steps:
        method_name: Optional[str] = state.state_execute(
            current, single_step=single_step
        )
        if method_name is None:
            continue  # Step was skipped

        try:
            step_func: Callable[
                [BootstrapModel, Github], Awaitable[BootstrapStepBase]
            ] = globals()[method_name]
            result: BootstrapStepBase = BootstrapStepBase()

            # Capture the starttime before executing the step
            # starttime: str = result.start_stamp()
            LOG(f"start time = {(starttime := result.start_stamp())}")
            result = await step_func(values, github_client)
            LOG(f"elapsed time = {result.stampFromStart(starttime)}")
            LOG(result)
            state.update(current.field, result)
        except KeyError:
            state.handle_error(
                f"Step '{current.field}' does not have a matching function '{method_name}'."
            )
            break
        except Exception as e:
            state.handle_error(
                f"An error occurred while processing step '{current.field}': {str(e)}"
            )
            break
    state.end_stamp()
    return state
