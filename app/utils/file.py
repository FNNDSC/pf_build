from pathlib import Path
from app.models.bootstrapModel import BootstrapModel
import re


def bootstrapScript_edit(file_path: Path, values: BootstrapModel) -> list[str]:
    """
    Edit the bootstrap.sh script based on the BootstrapModel values.

    Args:
        file_path (Path): Path to the bootstrap.sh script.
        values (BootstrapModel): BootstrapModel containing the values to replace in the script.

    Returns:
        None
    """
    # Read the file content
    with file_path.open("r") as f:
        lines: list[str] = f.readlines()

    script_lines: list[str] = []
    changed_lines: list[str] = []
    for line in lines:
        original_line = line
        # Replace placeholders with values
        line = re.sub(
            r"PLUGIN_TITLE='.*'", f"PLUGIN_TITLE='{values.plugin_title}'", line
        )
        line = re.sub(r"SCRIPT_NAME='.*'", f"SCRIPT_NAME='{values.scriptname}'", line)
        line = re.sub(r"DESCRIPTION='.*'", f"DESCRIPTION='{values.description}'", line)
        line = re.sub(
            r"ORGANIZATION='.*'", f"ORGANIZATION='{values.organization}'", line
        )
        line = re.sub(r"EMAIL='.*'", f"EMAIL='{values.email}'", line)
        # Uncomment READY=yes
        if line.strip() == "#READY=yes":
            line = "READY=yes\n"
        script_lines.append(line)

        if line != original_line:
            changed_lines.append(line)

    # Write the updated content back to the file
    with file_path.open("w") as f:
        f.writelines(script_lines)

    return changed_lines
