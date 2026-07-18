from pydantic_settings import BaseSettings


class TavilySettings(BaseSettings):
    tavily_api_key: str
    tavily_base_url: str = "https://api.tavily.com"
    tavily_timeout_seconds: float = 20
    tavily_max_retries: int = 2
    tavily_default_max_results: int = 10

