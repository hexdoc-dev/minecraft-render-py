from typing import Protocol

from .types import ResourcePath


class IResourcePathAsString(Protocol):
    def __call__(self, path: ResourcePath, /) -> str:
        ...
