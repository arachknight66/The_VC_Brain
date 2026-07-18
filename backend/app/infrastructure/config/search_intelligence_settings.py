from pydantic_settings import BaseSettings


class SearchIntelligenceSettings(BaseSettings):
    search_cache_enabled: bool = True
    search_persistence_enabled: bool = True
    search_metrics_enabled: bool = True
    search_default_provider: str = "tavily"

