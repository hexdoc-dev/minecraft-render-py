from typing import Protocol

from minecraft_render.dataset.types import ResourcePath


class IResourcePathAsString(Protocol):
    def __call__(self, path: ResourcePath, /) -> str:
        ...
