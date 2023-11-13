from typing import Protocol

from ..utils.resource import IResourceLocation
from ..utils.types import RendererOptions
from .types import IResourceLoader


class IRenderClass(Protocol):
    def __init__(self, loader: IResourceLoader, options: RendererOptions, /) -> None:
        ...

    def renderToFile(
        self,
        id: IResourceLocation,
        filename: str = ...,
        /,
    ) -> tuple[str, str] | None:
        ...

    def destroyRenderer(self) -> None:
        ...
