import shutil
import subprocess
from typing import Any

from hatchling.builders.hooks.plugin.interface import BuildHookInterface


class CustomBuildHook(BuildHookInterface[Any]):
    def initialize(self, version: str, build_data: dict[str, Any]) -> None:
        subprocess.run([which("npm"), "install"])
        subprocess.run(which("tsc"))

    def clean(self, versions: list[str]) -> None:
        subprocess.run([which("tsc"), "--build", "--clean"])


def which(name: str):
    path = shutil.which(name)
    if path is None:
        raise FileNotFoundError(f"Executable not found: {name}")
    return path
