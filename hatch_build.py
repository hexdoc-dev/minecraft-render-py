import json
import sys
from pathlib import Path
from textwrap import dedent
from typing import Any

stderr = sys.stderr

from hatchling.builders.hooks.plugin.interface import BuildHookInterface


class CustomBuildHook(BuildHookInterface[Any]):
    def initialize(self, version: str, build_data: dict[str, Any]) -> None:
        root = Path(self.root)

        package_file = root / "package.json"
        with package_file.open() as f:
            package: dict[str, Any] = json.load(f)

        if version == "editable":
            npm_name = str(root / "dist" / "js" / "index.js")
            npm_version = None
        else:
            npm_name = package["name"]
            npm_version = package["version"]

        py_path = root / Path(self.config["py-path"])
        py_path.write_text(
            dedent(
                f"""\
                # This file is auto-generated by Hatch. Do not edit.
                NPM_NAME = {npm_name!r}
                NPM_VERSION = {npm_version!r}
                """
            )
        )
