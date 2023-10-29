from typing import Required, TypedDict

Number = int | float


class RendererOptions(TypedDict, total=False):
    outDir: Required[str]
    width: Number | None
    height: Number | None
    distance: Number | None
    verbose: Number | None
    plane: Number | None
    animation: bool | None
