from django.core.cache import cache


STORE_CACHE_VERSION_KEY = "store-cache-version"


def get_store_cache_version():
    version = cache.get(STORE_CACHE_VERSION_KEY)
    if version is None:
        version = 1
        cache.set(STORE_CACHE_VERSION_KEY, version, None)
    return version


def bump_store_cache_version():
    version = get_store_cache_version() + 1
    cache.set(STORE_CACHE_VERSION_KEY, version, None)
    return version


def store_cache_key(key):
    return f"store:v{get_store_cache_version()}:{key}"
