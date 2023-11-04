from typing import Any, Protocol, TypedDict


class ResourcePath(TypedDict):
    namespace: str
    objectType: str
    identifier: str
    suffix: str
    variants: list[str]


class IResourceLoader(Protocol):
    def loadTexture(self, path: ResourcePath, /) -> Any:
        ...

    def loadJSON(self, path: ResourcePath, /) -> Any:
        ...
