# Scanners, LinkedIn Evidence, and Pitch Intake

## Scanner execution

`scanners/orchestrator.py` is the single scanner execution boundary. It validates requested source names, caps result counts, runs each source independently, and passes every normalized result to `SignalStore`.

| Source | Integration | Public data collected |
|---|---|---|
| GitHub | GitHub repository Search API | Repository identity, URL, description, stars, forks, language, topics, owner, creation time, and latest push |
| X | Tavily domain search for `x.com` and `twitter.com` | Indexed public post/profile title, URL, excerpt, and provider relevance |
| Substack | Tavily domain search for `substack.com` | Indexed public publication/post title, URL, excerpt, and provider relevance |
| Devpost | Tavily domain search for `devpost.com` | Indexed public project/profile title, URL, excerpt, and provider relevance |
| LinkedIn | Tavily domain search for public LinkedIn profile/company pages | Indexed public title, URL, excerpt, and provider relevance |

The web scanner rejects Tavily results outside the requested source domain. This prevents a broad search result from being mislabeled as LinkedIn, Devpost, Substack, or X evidence.

## Signal persistence

The `signals` SQLite table stores:

- Stable internal `signal_id`.
- `source` and provider `external_id`.
- Title, canonical source URL, originating query, and calculated score.
- Observation timestamp and raw/unconfirmed status.
- A JSON snapshot containing the complete normalized signal and provider metadata.

The unique `(source, external_id)` constraint updates rediscovered signals instead of creating duplicates.

## GitHub scoring

The GitHub scanner score is a bounded 0–100 activity indicator derived from:

- Log-scaled stars.
- Log-scaled forks.
- Recency of the latest push.

It is a sourcing signal, not an investment recommendation or proof of star velocity. Historical velocity requires scheduled snapshots, which are not claimed by this implementation.

## Public LinkedIn support

Two LinkedIn paths exist:

1. Stage 0 discovery through the LinkedIn scanner.
2. Activated-founder enrichment through `agents/linkedin_agent.py`.

Founder enrichment searches for the founder name and company on public LinkedIn pages. Evidence is stored in `FounderRecord.source_evidence` with source, title, URL, excerpt, collection timestamp, and confidence. A supplied LinkedIn URL receives stronger identity confidence when the returned public URL matches exactly.

This integration does not use LinkedIn credentials and cannot read private profiles, connections, private employment fields, or content blocked from public indexing.

## Pitch upload execution trace

```text
Investor selects a pitch in Next.js
  ↓
multipart POST /founders/inbound/upload
  ↓
size/type/content validation and in-memory extraction
  ↓
FounderRecord creation
  ↓
public LinkedIn evidence collection
  ↓
entity resolution and thesis screening
  ↓
scoring, trust, memo, and adversarial agents
  ↓
SQLite FounderStore upsert
  ↓
FounderRecord response
  ↓
frontend completion card
```

Files larger than 10 MB, empty files, unreadable PDFs, unsupported formats, and non-UTF-8 text files return a client error. Raw uploaded bytes are not written to disk by this route.

## API reference

### `POST /scanners/run`

Request:

```json
{
  "query": "climate infrastructure",
  "sources": ["github", "substack", "devpost", "linkedin"],
  "max_results": 8
}
```

Response includes the requested sources, persisted signals, signal count, and per-source errors.

### `GET /scanners/sources`

Returns the supported source identifiers.

### `GET /signals`

Optional query parameters:

- `source`: one supported source.
- `limit`: 1–500.

Returns signals plus persisted counts grouped by source.

### `POST /founders/inbound/upload`

Multipart fields:

| Field | Required | Notes |
|---|---:|---|
| `pitch` | Yes | PDF, TXT, or Markdown; maximum 10 MB |
| `name` | Yes | Founder name |
| `company_name` | Yes | Company name |
| `linkedin_url` | No | Public profile URL |
| `github_handle` | No | Public GitHub handle |
| `sector` | No | Thesis screening input |
| `stage` | No | Thesis screening input |
| `geography` | No | Thesis screening input |

## Configuration

Required for live AI and web search:

- `OPENAI_API_KEY`
- `TAVILY_API_KEY`

Optional:

- `GITHUB_TOKEN`: raises GitHub API rate limits.
- `NEXT_PUBLIC_VC_BRAIN_API_URL`: backend URL used by the Next.js app.
- `VC_BRAIN_ALLOWED_ORIGINS`: comma-separated frontend origins accepted by FastAPI CORS.

`.env.example` intentionally remains unchanged to match the `bhargavi` branch requirement.
