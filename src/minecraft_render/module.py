from typing import Protocol, cast

import javascript as js

from .dataset.Loader import (
    ICreateMultiloader,
    IMinecraftAssetsLoader,
    IPythonLoaderWrapper,
)
from .dataset.RenderClass import IRenderClass
from .dataset.utils import IResourcePathAsString


class IMinecraftRenderModule(Protocol):
    createMultiloader: ICreateMultiloader
    resourcePathAsString: IResourcePathAsString

    RenderClass: type[IRenderClass]
    MinecraftAssetsLoader: type[IMinecraftAssetsLoader]
    PythonLoaderWrapper: type[IPythonLoaderWrapper]


# we actually import the js module here
_module = cast(
    IMinecraftRenderModule,
    js.require("./_dist/index.js"),  # pyright: ignore[reportUnknownMemberType]
)

createMultiloader = _module.createMultiloader
resourcePathAsString = _module.resourcePathAsString
RenderClass = _module.RenderClass
MinecraftAssetsLoader = _module.MinecraftAssetsLoader
PythonLoaderWrapper = _module.PythonLoaderWrapper
