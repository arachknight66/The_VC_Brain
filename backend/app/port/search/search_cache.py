from abc import ABC, abstractmethod


class SearchCache(ABC):
    @abstractmethod
    async def get(self, key: str) -> dict | None:
        """Return cached search payload when available."""

    @abstractmethod
    async def set(self, key: str, value: dict, ttl_seconds: int) -> None:
        """Persist cache payload."""

