from fastapi import APIRouter, Query
from typing import Optional
from app.models.bootstrapModel import (
    BootstrapModel,
    BootstrapResponse,
    BootstrapStep,
    BootstrapState,
)
from app.core.controllers import bootstrapController
import pudb
from textwrap import dedent


router = APIRouter()
router.tags = ["Bootstrap services"]

STEP_DESCRIPTIONS = """
    - all               - Execute complete bootstrap process
    - repoExists        - Only check if repository exists
    - repoCreateInitial - Only create initial repository from template
    - gitClone          - Only clone existing repository
    - shellEdit         - Only edit bootstrap script
    - shellExec         - Only execute bootstrap script
    - gitCommit         - Only commit the changes from the shellExec
    """


@router.post("/boostrap/")
async def boostrap_post(
    values: BootstrapModel,
    step: str = Query(
        "all",
        description=f"Bootstrap step to execute. Options:\n\n<pre>{STEP_DESCRIPTIONS}</pre>",
    ),
    token: Optional[str] = None,
) -> BootstrapState:
    state = BootstrapState()
    # pudb.set_trace()
    try:
        # Convert the string back to BootstrapStep
        bootstrap_step = next(
            step_enum for step_enum in BootstrapStep if step_enum.field == step
        )
    except StopIteration:
        # Return a response indicating the invalid step
        state.handle_error(
            f"Invalid step value '{step}'. Allowed values are: {[s.field for s in BootstrapStep]}"
        )
        return state

    # Proceed with the valid bootstrap step
    state = await bootstrapController.bootstrap_exec(values, bootstrap_step, token)
    return state


# Dynamically set the docstring after function definition
boostrap_post.__doc__ = f"""
**Description**
Receive a set of bootstrap values and process them.

**Parameters**
- `values` (*`BootstrapModel`*): The bootstrap values provided in the request body.
- `step` (*`str`*): Step to execute. If not `all`, only the specified step will execute. This assumes that prerequisites are met. Options:
    {STEP_DESCRIPTIONS}
- `token` (*`Optional[str]`*): An optional GitHub token. If provided, this token will override the default token
    from the server configuration and will be used for all GitHub API operations during this request.

**Returns**
- `BootstrapState`: The state of all steps after execution.
"""
