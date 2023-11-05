__all__ = ["PythonResourceLoader", "ResourcePath", "require"]


from .types.dataset.Loader import PythonResourceLoader
from .types.dataset.types import ResourcePath


def require():
    """Lazy-import the JavaScript module."""
    from .js_module import js_module

    return js_module
