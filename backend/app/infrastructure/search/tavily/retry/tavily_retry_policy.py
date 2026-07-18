class TavilyRetryPolicy:
    def __init__(self, max_retries: int = 2) -> None:
        self.max_retries = max_retries

