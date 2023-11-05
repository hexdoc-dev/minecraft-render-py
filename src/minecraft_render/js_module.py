from typing import Protocol, cast

import javascript as js

from .__npm_version__ import NPM_NAME, NPM_VERSION
from .types.dataset.Loader import (
    ICreateMultiloader,
    IMinecraftAssetsLoader,
    IPythonLoaderWrapper,
)
from .types.dataset.RenderClass import IRenderClass
from .types.dataset.utils import IResourcePathAsString
from .types.utils.resource import IResourceLocation


class IMinecraftRenderModule(Protocol):
    createMultiloader: ICreateMultiloader
    resourcePathAsString: IResourcePathAsString

    MinecraftAssetsLoader: type[IMinecraftAssetsLoader]
    PythonLoaderWrapper: type[IPythonLoaderWrapper]
    RenderClass: type[IRenderClass]
    ResourceLocation: type[IResourceLocation]


# import the JavaScript module
js_module = cast(
    IMinecraftRenderModule,
    js.require(NPM_NAME, NPM_VERSION),  # pyright: ignore[reportUnknownMemberType]
)

createMultiloader = js_module.createMultiloader
resourcePathAsString = js_module.resourcePathAsString

MinecraftAssetsLoader = js_module.MinecraftAssetsLoader
PythonLoaderWrapper = js_module.PythonLoaderWrapper
RenderClass = js_module.RenderClass
ResourceLocation = js_module.ResourceLocation
