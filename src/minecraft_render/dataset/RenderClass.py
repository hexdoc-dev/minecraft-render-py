from ..utils.types import RendererOptions
from .types import IResourceLoader


class IRenderClass:
    def __init__(self, loader: IResourceLoader, options: RendererOptions, /) -> None:
        ...

    def renderToFile(self, namespace: str, identifier: str | None = None, /) -> str:
        ...

    def destroyRenderer(self) -> None:
        ...
