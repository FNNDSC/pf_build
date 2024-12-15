from pathlib import Path
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel
import subprocess
import os
import json
import shlex
import uuid
from app.config import settings


class JobResult(BaseModel):
    stdout: str = ""
    stderr: str = ""
    cmd: str
    cwd: str
    returncode: int
    script: Optional[str] = None
    uid: Optional[str] = None


class Jobber:
    def __init__(self, d_args: dict[str, Any]) -> None:
        """
        Constructor for the Jobber class.

        Args:
            d_args (dict): A dictionary of "arguments" (parameters) for the object.
        """
        self.args: dict[str, Any] = d_args.copy()
        if "verbosity" not in self.args:
            self.args["verbosity"] = 0
        if "noJobLogging" not in self.args:
            self.args["noJobLogging"] = False
        self.execCmd: Path = Path("somefile.cmd")
        self.histlogPath: Path = Path("/tmp")

    @staticmethod
    def logHistoryPath_create() -> Path:
        """Creates the log directory structure and returns the path."""
        today: datetime = datetime.today()
        year_dir: str = str(today.year)
        date_dir: str = today.strftime("%Y-%m-%d")
        log_path: Path = (
            settings.appData.appConfigDir / "pfmdb-history" / year_dir / date_dir
        )
        try:
            log_path.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            print(f"An error in creating the logHistoryPath occurred: {e}")
            log_path = Path("/tmp")
        return log_path

    @staticmethod
    def v2JSONcli(v: str) -> str:
        """Converts a JSON string serialization into a CLI-compliant string."""
        try:
            json.loads(v)
            return f"'{v}'"
        except json.JSONDecodeError:
            return v

    def dict2cli(self, d_dict: dict[str, Any]) -> str:
        """
        Converts a dictionary into a CLI-conformant string.

        Args:
            d_dict (dict): A Python dictionary to convert.

        Returns:
            str: CLI-equivalent string.
        """
        str_cli: str = ""
        for k, v in d_dict.items():
            if isinstance(v, bool):
                if v:
                    str_cli += f"--{k} "
            elif v:
                str_cli += f"--{k} {self.v2JSONcli(v)} "
        return str_cli

    def job_run(self, str_cmd: str) -> JobResult:
        """
        Executes a CLI process and returns stderr, stdout, and return code.

        Args:
            str_cmd (str): Command to execute.

        Returns:
            JobResult: Execution details, including stdout, stderr, and return code.
        """
        result = JobResult(
            cmd=str_cmd,
            cwd=os.getcwd(),
            returncode=0,
        )
        try:
            process = subprocess.Popen(
                shlex.split(str_cmd),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )

            stdout, stderr = process.communicate()
            result.stdout = stdout.decode("utf-8") if stdout else ""
            result.stderr = stderr.decode("utf-8") if stderr else ""
            result.returncode = process.returncode

            if int(self.args["verbosity"]):
                print(result.stdout, end="")
                if result.stderr:
                    print(f"\nstderr: {result.stderr}")

        except Exception as e:
            result.stderr = f"An error occurred: {e}"
            result.returncode = -1

        return result

    def job_runFromScript(self, str_cmd: str) -> JobResult:
        """
        Runs a job as a script (background process).

        Args:
            str_cmd (str): CLI string to run.

        Returns:
            JobResult: Execution state.
        """

        def scriptContent_generate(message: str) -> str:
            return f"#!/bin/bash\n\n{message}\n"

        def script_save(file_path: Path, script_content: str) -> None:
            with file_path.open("w") as f:
                f.write(script_content)
            file_path.chmod(0o755)

        base_file_name: str = f"job-{uuid.uuid4().hex}"
        self.execCmd = self.logHistoryPath_create() / f"{base_file_name}.sh"

        script_save(self.execCmd, scriptContent_generate(str_cmd))
        process = subprocess.Popen(
            [str(self.execCmd)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            close_fds=True,
        )

        result = JobResult(
            cmd=str_cmd,
            cwd=os.getcwd(),
            script=str(self.execCmd),
            uid=str(os.getuid()),
            returncode=process.returncode,
        )

        if process:
            stdout, stderr = process.communicate()
            result.stdout = stdout.decode("utf-8") if stdout else ""
            result.stderr = stderr.decode("utf-8") if stderr else ""

        return result

    def job_stdwrite(
        self, d_job: JobResult, str_output_dir: str, str_prefix: str = ""
    ) -> dict[str, bool]:
        """
        Captures the job entries into respective files.

        Args:
            d_job (JobResult): Job execution details.
            str_output_dir (str): Output directory for logs.
            str_prefix (str): Prefix for log filenames.

        Returns:
            dict: Status of the operation.
        """
        try:
            if not self.args["noJobLogging"]:
                output_dir = Path(str_output_dir)
                output_dir.mkdir(parents=True, exist_ok=True)

                for key in d_job.model_fields:
                    value = getattr(d_job, key, "")
                    if value:
                        with open(output_dir / f"{str_prefix}{key}", "w") as f:
                            f.write(str(value))
            return {"status": True}
        except Exception as e:
            print(f"Error writing job logs: {e}")
            return {"status": False}
