from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from pathlib import Path
import pudb


class StatusWithMessage(BaseModel):
    status: bool = True
    message: str = ""


class VaultStatus(StatusWithMessage):
    locked: bool = False


class VaultKey(BaseModel):
    """
    Simply a "key" and a "value"
    """

    vaultKey: str = ""


class CredentialsStatus(StatusWithMessage):
    pass


class Credentials(BaseModel):
    """
    A simple class to hold sensitive data, including the
    usernames and passwords for various backend services.

    This is not by default super secure, and read/write
    access is governed by the `vaultKey`.

    Access (GET/PUT) to the usernames and passwords needs
    a `vaultKey` token passed in the URL. This `vaultKey`
    is empty on startup, and needs to be set _once_. Once
    set it cannot be retrieved, but can be reset in the API.
    """

    username: str = ""
    password: str = ""
    cubeURL: str = ""


class CredentialsAdd(StatusWithMessage):
    pass


class Passwd(BaseModel):
    entry: dict[str, Credentials] = {}
