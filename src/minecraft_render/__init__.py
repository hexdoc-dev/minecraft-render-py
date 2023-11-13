__all__ = [
    "PythonResourceLoader",
    "ResourcePath",
    "js",
]


import logging
import sys
from typing import TYPE_CHECKING

from .types.dataset.Loader import PythonResourceLoader
from .types.dataset.types import ResourcePath

logger = logging.getLogger(__name__)


class _LazyLoader:
    def __getattribute__(self, name: str):
        if "minecraft_render.js_module" not in sys.modules:
            logger.debug("Lazy-importing minecraft_render.js_module")

        from . import js_module

        return getattr(js_module, name)


# importing javascript is expensive and requires a display server
# so we'll put it behind a lazy import
if TYPE_CHECKING:
    from . import js_module as js
else:
    js = _LazyLoader()
