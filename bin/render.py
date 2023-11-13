import base64
from pathlib import Path

from minecraft_render import PythonResourceLoader, ResourcePath, js


class HexdocResourceLoader(PythonResourceLoader):
    def loadTexture(self, resource_path: ResourcePath) -> str:
        path = f"../HexMod/Common/src/main/resources/assets/{js.resourcePathAsString(resource_path)}"
        print(f"find: {path}")

        file_path = Path(path)
        if not file_path.exists():
            raise FileNotFoundError(path)
        return base64.b64encode(file_path.read_bytes()).decode()

    def loadJSON(self, resource_path: ResourcePath) -> str:
        path = f"../HexMod/Common/src/generated/resources/assets/{js.resourcePathAsString(resource_path)}"
        print(f"load: {path}")
        return Path(path).read_text("utf-8")

    def close(self):
        pass


minecraft_loader = js.MinecraftAssetsLoader.fetchAll("master", "1.19.1")

loader = js.createMultiloader(
    js.PythonLoaderWrapper(HexdocResourceLoader()),
    minecraft_loader,
)

renderer = js.RenderClass(loader, {"outDir": "out"})

renderer.renderToFile(js.ResourceLocation("hexcasting", "akashic_record"))

print(minecraft_loader.buildURL("minecraft/item/stick.png"))

# TODO:
# fix buildURL arguments
# fix weird button/pressure plate/stairs rotations
# send npm install output to stderr instead of stdout
# add __main__ to allow doing eg. `python -m minecraft_render` to preinstall package
# integrate with hexdoc
# integrate with hexdoc
