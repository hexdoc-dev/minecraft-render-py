__all__ = [
    "createMultiloader",
    "JavaScriptError",
    "MinecraftAssetsLoader",
    "PythonLoaderWrapper",
    "RenderClass",
    "ResourceLocation",
    "resourcePathAsString",
]

from typing import Protocol, cast

import javascript
from javascript.errors import JavaScriptError

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
_js_module = cast(
    IMinecraftRenderModule,
    javascript.require(  # pyright: ignore[reportUnknownMemberType]
        name=NPM_NAME,
        version=NPM_VERSION,
    ),
)

createMultiloader = _js_module.createMultiloader
resourcePathAsString = _js_module.resourcePathAsString

MinecraftAssetsLoader = _js_module.MinecraftAssetsLoader
PythonLoaderWrapper = _js_module.PythonLoaderWrapper
RenderClass = _js_module.RenderClass
ResourceLocation = _js_module.ResourceLocation
