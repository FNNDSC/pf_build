import asyncio
from app.models import credentialModel
import os
from datetime import datetime

import json
import pudb
from app.config import settings


def vault_statusGet() -> credentialModel.VaultStatus:
    # pudb.set_trace()
    vaultStatus: credentialModel.VaultStatus = settings.vault.status_get()
    return vaultStatus


def vaultKey_set(key: str) -> credentialModel.VaultStatus:
    # pudb.set_trace()
    vaultStatus: credentialModel.VaultStatus = settings.vault.set(key)
    return vaultStatus


def credentialAccess_check(vaultKey: str) -> credentialModel.CredentialsStatus:
    access: credentialModel.CredentialsStatus = credentialModel.CredentialsStatus()
    if not settings.vault.status.locked:
        access.status = False
        access.message = (
            "The vault has not been locked and no key set. No access is possible."
        )
    elif vaultKey != settings.vault.key.vaultKey:
        access.status = False
        access.message = "Incorrect vaultKey! No access is possible."
    else:
        access.status = True
        access.message = "vaultKey OK!"
    return access


def userCredentials_add(
    key: str, username: str, password: str, cubeURL: str
) -> credentialModel.StatusWithMessage:
    # pudb.set_trace()
    access: credentialModel.CredentialsStatus = credentialAccess_check(key)
    if not access.status:
        return access
    addUser: credentialModel.StatusWithMessage = credentialModel.StatusWithMessage()
    # keyCheck: credentialModel.StatusWithMessage = settings.vault.key_use(key)
    # if not keyCheck.status:
    #     return keyCheck
    login: credentialModel.Credentials = credentialModel.Credentials()
    login.username = username
    login.password = password
    login.cubeURL = cubeURL
    addUser = settings.passwd.entry_add(login)
    return addUser


def passwd_get(key: str) -> credentialModel.Passwd:
    # pudb.set_trace()
    passwdData: credentialModel.Passwd = credentialModel.Passwd()
    access: credentialModel.CredentialsStatus = credentialAccess_check(key)
    if not access.status:
        return passwdData
    passwdData = settings.passwd.initialize()
    return passwdData
