"""
app/models/challenge.py
Pydantic schemas for challenges and submissions.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum


class Difficulty(str, Enum):
    easy   = "easy"
    medium = "medium"
    hard   = "hard"


class Category(str, Enum):
    algorithms     = "algorithms"
    data_structures = "data-structures"
    system_design  = "system-design"
    databases      = "databases"
    frontend       = "frontend"
    backend        = "backend"


# ── Challenge document ─────────────────────────────────────────────────────

class TestCase(BaseModel):
    input:          str
    expected_output: str
    is_hidden:      bool = False


class ChallengeInDB(BaseModel):
    title:        str
    slug:         str                   # URL-friendly unique key
    difficulty:   Difficulty
    category:     Category
    tags:         List[str] = []
    description:  str                   # Markdown
    examples:     List[dict] = []       # [{input, output, explanation}]
    constraints:  List[str] = []
    starter_code: dict = {}             # {python, javascript, java, ...}
    test_cases:   List[TestCase] = []
    xp_reward:    int = 100
    created_at:   datetime = Field(default_factory=datetime.utcnow)


class ChallengePublic(BaseModel):
    """Safe challenge sent to the client — no hidden test cases."""
    id:           str
    title:        str
    slug:         str
    difficulty:   Difficulty
    category:     Category
    tags:         List[str]
    description:  str
    examples:     List[dict]
    constraints:  List[str]
    starter_code: dict
    xp_reward:    int
    created_at:   datetime


class ChallengeSummary(BaseModel):
    """Lightweight card used in the browse list."""
    id:          str
    title:       str
    slug:        str
    difficulty:  Difficulty
    category:    Category
    tags:        List[str]
    xp_reward:   int


# ── Submission schemas ─────────────────────────────────────────────────────

class SubmitRequest(BaseModel):
    language: str = Field(..., pattern="^(python|javascript|java|cpp)$")
    code:     str = Field(..., min_length=1, max_length=50_000)


class TestResult(BaseModel):
    passed:   bool
    input:    str
    expected: str
    got:      str
    hidden:   bool = False


class SubmissionResult(BaseModel):
    accepted:     bool
    passed:       int
    total:        int
    xp_earned:    int
    new_total_xp: int
    new_level:    int
    new_streak:   int
    test_results: List[TestResult]
    message:      str


# ── Helper ─────────────────────────────────────────────────────────────────

def challenge_doc_to_summary(doc: dict) -> ChallengeSummary:
    return ChallengeSummary(
        id=str(doc["_id"]),
        title=doc["title"],
        slug=doc["slug"],
        difficulty=doc["difficulty"],
        category=doc["category"],
        tags=doc.get("tags", []),
        xp_reward=doc.get("xp_reward", 100),
    )


def challenge_doc_to_public(doc: dict) -> ChallengePublic:
    # Strip hidden test cases before sending to client
    safe_tests = [
        {"input": t["input"], "expected_output": t["expected_output"]}
        for t in doc.get("test_cases", [])
        if not t.get("is_hidden", False)
    ]
    return ChallengePublic(
        id=str(doc["_id"]),
        title=doc["title"],
        slug=doc["slug"],
        difficulty=doc["difficulty"],
        category=doc["category"],
        tags=doc.get("tags", []),
        description=doc["description"],
        examples=doc.get("examples", []),
        constraints=doc.get("constraints", []),
        starter_code=doc.get("starter_code", {}),
        xp_reward=doc.get("xp_reward", 100),
        created_at=doc["created_at"],
    )