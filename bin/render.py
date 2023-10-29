import base64
import json
from pathlib import Path
from typing import TypedDict
import javascript as js

minecraft_render = js.require("../dist/index.js")
RenderClass = minecraft_render.RenderClass
MinecraftAssetsLoader = minecraft_render.MinecraftAssetsLoader
createMultiloader = minecraft_render.createMultiloader
PythonLoaderWrapper = minecraft_render.PythonLoaderWrapper
resourcePathAsString = minecraft_render.resourcePathAsString


class ResourcePath(TypedDict):
    namespace: str
    objectType: str
    identifier: str
    suffix: str

class HexdocResourceLoader:
    def loadTexture(
        self,
        resource_path: ResourcePath
    ):
        path = f"../HexMod/Common/src/main/resources/assets/{resourcePathAsString(resource_path)}"
        print(f"find: {path}")

        file_path = Path(path)
        if not file_path.exists():
            raise FileNotFoundError(path)
        return base64.b64encode(file_path.read_bytes()).decode()

    def loadJSON(
        self,
        resource_path: ResourcePath
    ):
        path = f"../HexMod/Common/src/generated/resources/assets/{resourcePathAsString(resource_path)}"
        print(f"load: {path}")
        return Path(path).read_text("utf-8")

minecraft_loader = MinecraftAssetsLoader.fetchAll("master", "1.19.1")

loader = createMultiloader(
    PythonLoaderWrapper(HexdocResourceLoader()),
    minecraft_loader,
)

renderer = RenderClass(loader, { "outDir": "out" })

renderer.renderToFile("hexcasting", "amethyst_sconce")
