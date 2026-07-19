from agents import linkedin_agent
from memory.models import FounderRecord


def test_linkedin_agent_writes_public_evidence(monkeypatch):
    monkeypatch.setattr(
        linkedin_agent,
        "search",
        lambda *args, **kwargs: [
            {
                "title": "Priya Nandakumar - Founder at Ridgeline",
                "url": "https://www.linkedin.com/in/priya-nandakumar",
                "content": "Public profile excerpt",
                "score": 0.89,
            }
        ],
    )
    record = FounderRecord(
        name="Priya Nandakumar",
        company_name="Ridgeline",
        source_channel="inbound",
        raw_inputs={"linkedin_url": "https://www.linkedin.com/in/priya-nandakumar"},
    )
    linkedin_agent.run(record)
    assert len(record.source_evidence) == 1
    assert record.source_evidence[0].source == "linkedin"
    assert record.source_evidence[0].confidence == 0.95
