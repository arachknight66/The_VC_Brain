class TavilyError(Exception):
    pass


class TavilyRateLimitError(TavilyError):
    pass


class TavilyTimeoutError(TavilyError):
    pass


class TavilyMalformedResponseError(TavilyError):
    pass

