from pydantic import BaseModel, Field, EmailStr, AnyUrl, ConfigDict
from typing import Optional
import pudb
from pudb.remote import set_trace
from pathlib import Path
from enum import Enum, auto
from app.config.settings import appData
from github import Github
from git import Repo
from app.utils.jobController import JobResult
from datetime import datetime


class BootstrapStep(Enum):
    ALL = ("all", None)
    REPO_EXISTS = ("repoExists", None)
    REPO_CREATE = ("repoCreateInitial", "repoExists")
    REPO_CLONE = ("gitClone", "repoCreateInitial")
    SCRIPT_EDIT = ("shellEdit", "gitClone")
    SCRIPT_EXEC = ("shellExec", "shellEdit")
    GIT_COMMIT = ("gitCommit", "shellExec")  # New state for committing changes

    def __init__(self, field: str, prev_field: str | None) -> None:
        self.field: str = field
        self.prev_field: str | None = prev_field


class BootstrapResponse(BaseModel):
    status: bool = False
    response: str = ""


class BootstrapStepBase(BaseModel):
    """Base model for any bootstrap step"""

    TIMESTAMP_FORMAT: str = (
        "%Y-%m-%d_%H:%M:%S"  # Define the format as a class-level constant
    )
    status: bool = Field(
        default=False, description="Indicates if the step was successful"
    )
    message: str = Field(default="", description="Message associated with the step")
    starttime: str = Field(default="", description="Timestamp when the step started")
    endtime: str = Field(default="", description="Timestamp when the step ended")

    def start_stamp(self, timestamp: str | None = None) -> str:
        """
        Sets the starttime field to the current timestamp or to the provided timestamp.

        Args:
            timestamp (str | None): Optional timestamp string. If provided, sets starttime to this value.
                                    If None, sets starttime to the current timestamp.
        """
        self.starttime = timestamp or datetime.now().strftime(self.TIMESTAMP_FORMAT)
        return self.starttime

    def end_stamp(self, timestamp: str | None = None) -> str:
        """
        Sets the endtime field to the current timestamp or to the provided timestamp.

        Args:
            timestamp (str | None): Optional timestamp string. If provided, sets endtime to this value.
                                    If None, sets endtime to the current timestamp.
        """
        self.endtime = timestamp or datetime.now().strftime(self.TIMESTAMP_FORMAT)
        return self.endtime

    def elapsed_time(self) -> str:
        """
        Calculate the elapsed time between starttime and endtime.

        Returns:
            str: Elapsed time in HH:MM:SS format, or a message if timestamps are invalid.
        """
        try:
            start = datetime.strptime(self.starttime, self.TIMESTAMP_FORMAT)
            end = datetime.strptime(self.endtime, self.TIMESTAMP_FORMAT)
            elapsed = end - start
            return str(elapsed)  # Returns HH:MM:SS format
        except ValueError:
            return "Invalid timestamps"

    def stampFromStart(self, timestart: str) -> str:
        """
        Updates the starttime and endtime fields, and calculates the elapsed time.

        Args:
            timestart (str): The start timestamp in the format defined by TIMESTAMP_FORMAT.

        Returns:
            str: The elapsed time between the provided starttime and the current endtime,
                 formatted as HH:MM:SS, or an error message if the timestamps are invalid.
        """
        self.starttime = timestart
        self.end_stamp()
        return self.elapsed_time()

    def skip_with_message(
        self, message: str = "Skipped due to previous step failure"
    ) -> None:
        """Set status to False with skip message"""
        self.status = False
        self.message = message


class GithubRepoExists(BootstrapStepBase):
    repo_name: str = ""
    exists: bool = False
    org_name: str = "FNNDSC"


class BootstrapModel(BaseModel):
    plugin_title: str = Field(..., description="The title of the plugin")
    scriptname: str = Field(..., description="The script name for the plugin")
    description: str = Field(
        ..., max_length=4096, description="A brief description of the plugin"
    )
    organization: str = Field(
        ..., description="The organization responsible for the plugin"
    )
    email: EmailStr = Field(..., description="The email of the author or maintainer")


class GithubRepoCheck(BootstrapStepBase):
    repo_name: str
    repo_exists: bool = False


class GithubRepoCreate(BootstrapStepBase):
    repo_name: str
    repo_created: bool = False  # Tracks if repo was actually created
    repo_url: Optional[str] = None  # Store the URL of created repo


class GitRepoDetails(BootstrapStepBase):
    """
    Represents detailed information about a successful repository clone.
    """

    repo_name: str
    repo_url: AnyUrl
    clone_path: Path
    branch: str = "main"


class GitCloneResponse(BootstrapStepBase):
    """
    Unified response model for the Git clone operation.
    """

    details: Optional[GitRepoDetails] = None


class ShellEditStep(BootstrapStepBase):
    script_path: str = ""
    changes_made: list[str] = []


class ShellExecStep(BootstrapStepBase):
    result: JobResult


class GitCommitResponse(BootstrapStepBase):
    details: Optional[GitRepoDetails] = None


class BootstrapState(BootstrapStepBase):
    """Tracks state of all bootstrap steps"""

    repoExists: GithubRepoExists | None = None
    repoCreateInitial: GithubRepoCreate | None = None
    gitClone: GitCloneResponse | None = None
    shellEdit: ShellEditStep | None = None
    shellExec: ShellExecStep | None = None
    gitCommit: GitCommitResponse | None = None

    def statusOverall_update(self, status: Optional[bool] = None) -> None:
        """
        Update the overall status of the bootstrap process.

        Args:
            status (Optional[bool]): If provided, sets the overall status directly.
                                     If None, computes the overall status from step statuses.
        """
        if status is not None:
            self.status = status
        else:
            # Only consider steps that are not None
            self.status = all(
                step.status
                for step in [
                    self.repoExists,
                    self.repoCreateInitial,
                    self.gitClone,
                    self.shellEdit,
                    self.shellExec,
                    self.gitCommit,
                ]
                if step is not None
            )

    def messageOverall_update(self, message: Optional[str] = None) -> None:
        """
        Update the overall message summarizing the bootstrap process.

        Args:
            message (Optional[str]): If provided, sets the overall message directly.
                                     If None, computes the overall message from step messages.
        """
        if message is not None:
            self.message = message
        else:
            messages = []
            if self.repoExists and not self.repoExists.status:
                messages.append(f"Repo exists check: {self.repoExists.message}")
            if self.repoCreateInitial and not self.repoCreateInitial.status:
                messages.append(f"Repo create: {self.repoCreateInitial.message}")
            if self.gitClone and not self.gitClone.status:
                messages.append(f"Git clone: {self.gitClone.message}")
            if self.shellEdit and not self.shellEdit.status:
                messages.append(f"Shell edit: {self.shellEdit.message}")
            if self.shellExec and not self.shellExec.status:
                messages.append(f"Shell exec: {self.shellExec.message}")
            if self.gitCommit and not self.gitCommit.status:
                messages.append(f"Git commit: {self.gitCommit.message}")

            self.message = (
                " | ".join(messages) if messages else "All steps completed successfully"
            )

    def handle_error(self, message: str) -> None:
        """
        Update the overall state with an error.

        Args:
            message (str): The error message to set.
        """
        self.statusOverall_update(False)
        self.messageOverall_update(message)

    @staticmethod
    def initialize_github_client(token: Optional[str]) -> Github | None:
        """
        Initialize the GitHub client.

        Args:
            token (Optional[str]): Optional GitHub token for authentication.

        Returns:
            Github | None: The initialized GitHub client or None if unavailable.
        """
        if token:
            appData.githubToken = token
        return (
            Github(appData.githubToken)
            if appData.githubToken
            else appData.githubClient_get()
        )

    def state_execute(
        self, step: BootstrapStep, single_step: bool = False
    ) -> str | None:
        """
        Determine if the step can be executed and return the method name.

        Args:
            step (BootstrapStep): The step to execute.
            single_step (bool): If True, bypass checks for the status of the previous step.

        Returns:
            str | None: The dynamic method name ('bootstrap_<step.field>') if executable, otherwise None.
        """
        if not single_step and step.prev_field:
            # Check the status of the previous step
            if not (
                getattr(self, step.prev_field) and getattr(self, step.prev_field).status
            ):
                step_model: BootstrapStepBase | None = getattr(self, step.field, None)
                if step_model:
                    step_model.skip_with_message(
                        f"{step.prev_field.replace('_', ' ')} failed"
                    )
                return None  # Skip this step

        # Return the dynamic method name
        return f"bootstrap_{step.field}"

    def update(self, field: str, result: BootstrapStepBase) -> None:
        """
        Update a field in the state and recalculate overall status and message.

        Args:
            field (str): The name of the field to update.
            result (BootstrapStepBase): The new value for the field.
        """
        setattr(self, field, result)
        self.statusOverall_update()
        self.messageOverall_update()
