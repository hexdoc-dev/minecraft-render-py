from typing import Required, TypedDict

Number = int | float


class RendererOptions(TypedDict, total=False):
    outDir: Required[str]
    cameraSize: Number | None
    imageSize: Number | None
    plane: bool | None
    animation: bool | None
    ambientLight: bool | None
