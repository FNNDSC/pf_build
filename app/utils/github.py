# app/utils/github_utils.py
from typing import Optional, Tuple, Any
from github import Github
from github.GithubObject import GithubObject
from github.Organization import Organization
from github.Repository import Repository
from app.config.settings import appData
from app.models.bootstrapModel import (
    GithubRepoExists,
    GithubRepoCreate,
    GitRepoDetails,
    GitCloneResponse,
    GitCommitResponse,
)
from loguru import logger
import git
from pathlib import Path
import tempfile


class GithubRepoUtil:
    """Utilities for GitHub repo operations: client object passed to each method"""

    @staticmethod
    async def repo_checkExists(
        github_client: Github | None, repo_name: str, org_name: str
    ) -> GithubRepoExists:
        """
        Check if a repository exists in FNNDSC organization

        Args:
            github_client: Github client object
            repo_name: Name of repository to check

        Returns:
            GithubRepoExists model
        """
        if not github_client:
            return GithubRepoExists(
                status=False,
                message="GitHub client not initialized",
                repo_name=repo_name,
            )
        try:
            org = (
                github_client.get_organization(org_name)
                if org_name
                else github_client.get_organization(appData.appOrganization)
            )
            try:
                org.get_repo(repo_name)
                return GithubRepoExists(
                    status=False,
                    exists=True,
                    message=f"Repository {repo_name} already exists",
                    repo_name=repo_name,
                )
            except Exception as e:
                return GithubRepoExists(
                    status=True,
                    exists=False,
                    repo_name=repo_name,
                    message=f"Repository {repo_name} is available: {str(e)}",
                )
        except Exception as e:
            logger.error(f"GitHub API error: {str(e)}")
            return GithubRepoExists(
                status=False,
                repo_name=repo_name,
                message=f"Error accessing GitHub API: {str(e)}",
            )

    @staticmethod
    async def repo_createFromTemplate(
        github_client: Github | None,
        repo_name: str,
        description: str,
        template_repo: str = "python-chrisapp-template",
        org_name: str = "FNNDSC",
    ) -> GithubRepoCreate:
        """
        Create a new repository from template

        Args:
            github_client: Github client object
            repo_name: Name for the new repository
            description: Repository description
            template_repo: Name of template repository
            org_name: Organization name

        Returns:
            GithubRepoCreate model
        """
        if not github_client:
            return GithubRepoCreate(
                status=False,
                message="GitHub client not initialized",
                repo_name=repo_name,
            )
        try:
            # org: Organization = github_client.get_organization(org_name)
            # template: Repository = org.get_repo(template_repo)

            # Direct API request for repository creation
            github_client._Github__requester.requestJsonAndCheck(
                "POST",
                f"/repos/{org_name}/{template_repo}/generate",
                input={
                    "name": repo_name,
                    "description": description,
                    "owner": org_name,
                    "private": False,
                },
            )
            return GithubRepoCreate(
                status=True,
                repo_name=repo_name,
                message=f"Repository {repo_name} created successfully from template",
            )

        except Exception as e:
            logger.error(f"GitHub API error: {str(e)}")
            return GithubRepoCreate(
                status=False,
                repo_name=repo_name,
                message=f"Error creating repository: {str(e)}",
            )

    @staticmethod
    async def repo_clone(
        github_client: Optional[Github],
        repo_name: str,
        org_name: str = "FNNDSC",
        base_dir: Optional[Path] = None,
    ) -> GitCloneResponse:
        """
        Clone a repository from the organization.

        Args:
            github_client: An instance of the GitHub client.
            repo_name: Name of repository to clone.
            org_name: Organization name.
            base_dir: Directory to clone into (uses user's home dir if None).

        Returns:
            GitCloneResponse: The result of the cloning process.
        """
        if not github_client:
            return GitCloneResponse(
                status=False, message="GitHub client not initialized", details=None
            )

        try:
            # Get repo details from GitHub
            org: Organization = github_client.get_organization(org_name)
            repo: Repository = org.get_repo(repo_name)
            clone_url = repo.clone_url

            # Setup clone directory
            checkout_dir: Path = base_dir or appData.appRepoLocalPath
            checkout_dir.mkdir(parents=True, exist_ok=True)
            clone_path: Path = checkout_dir / repo_name

            # Perform the clone using GitPython and capture the result
            cloned_repo: git.Repo = git.Repo.clone_from(clone_url, str(clone_path))

            return GitCloneResponse(
                status=True,
                message=f"Repository cloned successfully to {clone_path}",
                details=GitRepoDetails(
                    status=True,
                    message="Successful clone",
                    repo_name=repo_name,
                    repo_url=clone_url,
                    clone_path=clone_path,
                    branch="main",
                ),
            )

        except git.exc.GitCommandError as e:
            logger.error(f"Git clone error: {str(e)}")
            return GitCloneResponse(
                status=False, message=f"Git clone failed: {str(e)}", details=None
            )
        except Exception as e:
            logger.error(f"Error during clone operation: {str(e)}")
            return GitCloneResponse(
                status=False,
                message=f"Error cloning repository: {str(e)}",
                details=None,
            )

    @staticmethod
    async def repo_commit(
        github_client: Optional[Github],
        token: str,
        repo_name: str,
        org_name: str = "FNNDSC",
        base_dir: Optional[Path] = None,
    ) -> GitCommitResponse:
        """
        Commit changes to the repository and push to the remote.

        Args:
            github_client: An instance of the GitHub client.
            token: Personal Access Token (PAT) for authentication.
            repo_name: Name of repository.
            org_name: Organization name.
            base_dir: Full path to the repository directory.

        Returns:
            GitCommitResponse: The result of the commit and push process.
        """
        if not github_client:
            return GitCommitResponse(
                status=False, message="GitHub client not initialized", details=None
            )

        try:
            # Use the provided base_dir or default to appData.appRepoLocalPath / repo_name
            repo_path: Path = base_dir or appData.appRepoLocalPath / repo_name

            # Load the existing repository
            repo: git.Repo = git.Repo(repo_path)

            # Update remote URL to include the token
            remote_url: str = (
                f"https://{github_client.get_user().login}:{token}@github.com/"
                f"{org_name}/{repo_name}.git"
            )
            repo.remotes.origin.set_url(remote_url)

            # Stage changes
            repo.git.add(".")
            if not repo.is_dirty():  # Check if there are any changes to commit
                return GitCommitResponse(
                    status=True,
                    message="No changes to commit.",
                    details=GitRepoDetails(
                        repo_name=repo_name,
                        repo_url=repo.remotes.origin.url,
                        clone_path=repo_path,
                        branch=repo.active_branch.name,
                    ),
                )

            # Commit changes
            commit_message: str = "Apply bootstrap updates"
            commit: git.Commit = repo.index.commit(commit_message)

            # Push changes
            origin: git.Remote = repo.remotes.origin
            try:
                origin.push()
            except git.exc.GitCommandError as push_error:
                logger.error(
                    f"Push failed: {str(push_error)}. Attempting a force push."
                )
                origin.push(refspec="main:main", force=True)

            return GitCommitResponse(
                status=True,
                message=f"Changes committed and pushed to {repo_name}.",
                details=GitRepoDetails(
                    status=True,
                    message="Successful commit",
                    repo_name=repo_name,
                    repo_url=repo.remotes.origin.url,
                    clone_path=repo_path,
                    branch=repo.active_branch.name,
                ),
            )

        except git.exc.GitCommandError as e:
            logger.error(f"Git commit error: {str(e)}")
            return GitCommitResponse(
                status=False, message=f"Git commit failed: {str(e)}", details=None
            )
        except Exception as e:
            logger.error(f"Error during commit operation: {str(e)}")
            return GitCommitResponse(
                status=False,
                message=f"Error committing repository: {str(e)}",
                details=None,
            )
