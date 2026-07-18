from datetime import timedelta

from pydantic import BaseModel


class SearchCachePolicy(BaseModel):
    cache_type: str
    ttl: timedelta
    refresh_priority: int
    stale_while_revalidate: bool = True

