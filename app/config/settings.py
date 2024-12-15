import os
from typing import Any, ClassVar, Type, ForwardRef, Optional
from pydantic import AnyHttpUrl, AnyUrl, BaseModel
from pydantic_settings import BaseSettings
from pathlib import Path
from github import Github
import platformdirs as pfd
import json
import pudb
import datetime
from app.models import credentialModel
import multiprocessing

Passwd = ForwardRef("Passwd")


class AppData(BaseSettings):
    appName: str = "pf_build"
    appAuthor: str = "FNNDSC"
    appOrganization: str = "FNNDSC"
    appConfigDir: Path = Path(pfd.user_config_dir(appName))
    appRepoLocalPath: Path = Path.home() / "repositories"
    appVaultKeyFile: Path = Path("key.txt")
    appVaultKeyStatus: Path = Path("key.json")
    appPasswdFile: Path = Path("passwd.json")
    appPasswdFP: Path = appConfigDir / appPasswdFile
    appVaultKeyFP: Path = appConfigDir / appVaultKeyFile
    appVaultStatusFP: Path = appConfigDir / appVaultKeyStatus
    githubToken: str = ""
    githubTokenFile: Path = Path("github_token.json")
    githubTokenFP: Path = appConfigDir / githubTokenFile
    githubClient: Optional[Github] = None

    class Config:
        env_prefix = ""

    def app_initialize(self):
        """Initialize app directories and bootstrap github token if available"""
        if not self.appConfigDir.exists():
            self.appConfigDir.mkdir(parents=True, exist_ok=True)

        env_token = os.getenv("GH_TOKEN")
        if env_token and not self.githubTokenFP.exists():
            self.githubToken_save(env_token)

        # Initialize GitHub client
        token = self.githubToken_get()
        if token:
            self.githubClient = Github(token)

    def githubToken_save(self, token: str) -> None:
        """
        Save GitHub token to a JSON file.

        Args:
            token (str): GitHub personal access token
        """
        token_data = {"token": token, "timestamp": str(datetime.datetime.now())}
        with open(self.githubTokenFP, "w") as f:
            json.dump(token_data, f)

        self.githubTokenFP.chmod(0o600)

    def githubToken_get(self) -> Optional[str]:
        """
        Retrieve GitHub token, checking both file and environment.

        Returns:
            Optional[str]: GitHub token if found, None otherwise
        """
        env_token = os.getenv("GH_TOKEN")
        if env_token and not self.githubToken:
            return env_token

        try:
            if self.githubToken:
                return self.githubToken
            if self.githubTokenFP.exists():
                with open(self.githubTokenFP, "r") as f:
                    data = json.load(f)
                return data.get("token")
            return None
        except Exception as e:
            print(f"Error reading GitHub token: {str(e)}")
            return None

    def githubClient_get(self) -> Optional[Github]:
        """
        Get the initialized GitHub client.

        Returns:
            Optional[Github]: Authenticated GitHub client if initialized
        """
        return self.githubClient


appData = AppData()
appData.app_initialize()


class Vault(BaseSettings):
    key: credentialModel.VaultKey = credentialModel.VaultKey()
    status: credentialModel.VaultStatus = credentialModel.VaultStatus()

    def initialize(self):
        if appData.appVaultKeyFP.exists():
            with open(appData.appVaultStatusFP, "r") as f:
                self.status = credentialModel.VaultStatus.parse_obj(json.load(f))
        if appData.appVaultKeyFP.exists():
            with open(appData.appVaultKeyFP, "r") as f:
                self.key.vaultKey = f.read()

    def save(self) -> credentialModel.VaultStatus:
        vaultStatus: credentialModel.VaultStatus = credentialModel.VaultStatus()
        try:
            with open(appData.appVaultKeyFP, "w") as f:
                f.write(self.key.vaultKey)
                vaultStatus.status = True
                vaultStatus.message = "Vault key added. "
        except Exception as e:
            vaultStatus.message = f"Error saving key: {e}"
        try:
            with open(appData.appVaultStatusFP, "w") as f:
                json.dump(self.status.dict(), f)
                vaultStatus.message += "Status updated."
        except Exception as e:
            vaultStatus.message += f"Error saving status: {e}"
        return vaultStatus

    def set(self, key: str) -> credentialModel.VaultStatus:
        if self.status.locked:
            self.status.message = "The vault is already locked and you cannot set a new key. Restart to reset."
        else:
            self.key.vaultKey = key
            self.status.locked = True
            self.status.message = (
                "The vault is now locked. Use the vaultKey to access prviliged data."
            )
            self.save()
        return self.status

    def status_get(self) -> credentialModel.VaultStatus:
        if self.status.locked:
            self.status.message = (
                "The value is already locked. Restart the server to resest."
            )
        else:
            self.status.message = (
                "The vault is currently unlocked. You can set a key ONCE."
            )
        return self.status

    def key_use(self, key: str) -> credentialModel.StatusWithMessage:
        access: credentialModel.StatusWithMessage = credentialModel.StatusWithMessage()
        if not self.status.locked:
            access.status = False
            access.message = (
                "The vault has not been locked and no key set. Set a key first."
            )
        elif key == self.key.vaultKey:
            access.status = True
            access.message = "vault unlocked"
        else:
            access.status = False
            access.message = "Incorrect vaultKey! No access is possible."
        return access


def vaultCheckLock(vault: Vault) -> None:
    if vault.key.vaultKey and not vault.status.locked:
        vault.status.locked = True
        print("Vault check: key has already been set. Vault is now LOCKED.")


class PasswdMgr(BaseSettings):
    passwdFile: Path = appData.appPasswdFP
    passwdDB: credentialModel.Passwd = credentialModel.Passwd()

    def initialize(self) -> credentialModel.Passwd:
        if self.passwdFile.exists():
            with open(self.passwdFile, "r") as f:
                self.passwdDB = credentialModel.Passwd.parse_obj(json.load(f))
        return self.passwdDB

    def save(self) -> credentialModel.CredentialsAdd:
        resp: credentialModel.CredentialsAdd = credentialModel.CredentialsAdd()
        try:
            with open(self.passwdFile, "w") as f:
                json.dump(self.passwdDB.dict(), f)
                resp.status = True
                resp.message = "PasswdDB updated."
        except Exception as e:
            resp.message = f"PasswdDB save error: {e}"
        return resp

    def entry_add(
        self, login: credentialModel.Credentials
    ) -> credentialModel.CredentialsAdd:
        store: credentialModel.CredentialsAdd = credentialModel.CredentialsAdd()
        self.passwdDB.entry[login.username] = login
        store = self.save()
        return store


# pudb.set_trace()
vault = Vault()
vault.initialize()
passwd = PasswdMgr()
