from fastapi import APIRouter

from app.models import credentialModel
from app.core.controllers import credentialController


import pudb

router = APIRouter()
router.tags = ["Credentialling services"]


@router.put(
    "/vaultKey/{key}",
    response_model=credentialModel.VaultStatus,
    summary="""
    PUT a new vault key.
    """,
)
def vaultKey_set(key: str) -> credentialModel.VaultStatus:
    """
    Description
    -----------

    A vault `key` is simply a string (like a password), and can be set with
    a call to this API endpoint.

    Note that a vault key can only be set _once_, and once set cannot be reset
    without a server restart. All subsequent calls to "priviledged" data
    structures (like user credentialling) need to supply the vaultKey to unlock
    the data.

    Args:
    -----
    * `key` (str): A key string.

    Returns:
    --------
    * `credentialModel.vaultStatus`: a status response.
    """
    vaultStatus: credentialModel.VaultStatus = credentialController.vaultKey_set(key)
    return vaultStatus


@router.get(
    "/vault/",
    response_model=credentialModel.VaultStatus,
    summary="""
    Return the vault status.
    """,
)
def vault_statusGet() -> credentialModel.VaultStatus:
    """
    Description
    -----------

    Simply return the status of the vault. This will inform the client
    if the vault is locked (and has a key), or if the vault is unlocked
    and so a key can be specified.

    Returns
    -------
    * `credentialModel.vaultStatus`: a status response.
    """
    vaultStatus: credentialModel.VaultStatus = credentialController.vault_statusGet()
    return vaultStatus


@router.post(
    "/vault/credentials/{username}/",
    response_model=credentialModel.CredentialsStatus,
    summary="""
    POST a new set of user credentials.
    """,
)
def user_add(
    vaultKey: str, username: str, password: str, cubeURL: str
) -> credentialModel.CredentialsStatus:
    """
    Description
    -----------

    Add a new user login credentials to the vault.

    Returns
    -------
    * `credentialModel.CredentialsStatus`: a status response.
    """
    addUser: credentialModel.StatusWithMessage = (
        credentialController.userCredentials_add(vaultKey, username, password, cubeURL)
    )
    return addUser


@router.get(
    "/vault/credentials/",
    response_model=credentialModel.Passwd,
    summary="""
    Return the credentials database.
    """,
)
def users_get(key: str) -> credentialModel.Passwd:
    """
    Description
    -----------

    Simply return the credentials file.

    Returns
    -------
    * `credentialModel.Passwd`: the credentials database.
    """
    passwd: credentialModel.Passwd = credentialController.passwd_get(key)
    return passwd
