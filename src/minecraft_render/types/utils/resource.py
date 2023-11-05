from typing import Protocol, Self


class IResourceLocation(Protocol):
    def __init__(
        self,
        namespace: str,
        path: str,
        preferredVariants: list[str] = ...,
        variantIndex: int | float = 0,
        /,
    ) -> None:
        ...

    @classmethod
    def parse(cls, raw: str, /) -> Self:
        ...

    def toId(self) -> str:
        ...

    def toString(self) -> str:
        ...

    def sortVariant(self, variant: str, /) -> int | float:
        ...
