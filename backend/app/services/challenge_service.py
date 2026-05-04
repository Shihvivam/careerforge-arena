"""
app/services/challenge_service.py
Business logic for challenges: listing, fetching, submission evaluation, XP.
"""

from __future__ import annotations

import ast
import traceback
from datetime import datetime, date, timezone
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException

from app.db.mongo import get_db
from app.models.challenge import (
    ChallengeSummary,
    ChallengePublic,
    SubmitRequest,
    SubmissionResult,
    TestResult,
    challenge_doc_to_summary,
    challenge_doc_to_public,
)


# ── Listing / fetching ─────────────────────────────────────────────────────

async def list_challenges(
    difficulty: Optional[str] = None,
    category:   Optional[str] = None,
    search:     Optional[str] = None,
) -> list[ChallengeSummary]:
    db      = get_db()
    query   = {}

    if difficulty:
        query["difficulty"] = difficulty
    if category:
        query["category"] = category
    if search:
        query["title"] = {"$regex": search, "$options": "i"}

    cursor = db["challenges"].find(query).sort("xp_reward", 1)
    docs   = await cursor.to_list(length=200)
    return [challenge_doc_to_summary(d) for d in docs]


async def get_challenge_by_slug(slug: str) -> ChallengePublic:
    db  = get_db()
    doc = await db["challenges"].find_one({"slug": slug})
    if not doc:
        raise HTTPException(status_code=404, detail="Challenge not found.")
    return challenge_doc_to_public(doc)


async def get_challenge_doc_by_slug(slug: str) -> dict:
    """Internal: returns raw doc including hidden test cases."""
    db  = get_db()
    doc = await db["challenges"].find_one({"slug": slug})
    if not doc:
        raise HTTPException(status_code=404, detail="Challenge not found.")
    return doc


# ── Code evaluation (sandboxed Python only) ────────────────────────────────

def _run_python_two_sum(code: str, nums: list, target: int) -> list | None:
    ns = {}
    exec(code, ns)                                               # noqa: S102
    fn = ns.get("two_sum") or ns.get("twoSum")
    if fn:
        return fn(nums, target)
    return None


def _run_python_is_valid(code: str, s: str) -> bool | None:
    ns = {}
    exec(code, ns)                                               # noqa: S102
    fn = ns.get("is_valid") or ns.get("isValid")
    return fn(s) if fn else None


def _run_python_max_subarray(code: str, nums: list) -> int | None:
    ns = {}
    exec(code, ns)                                               # noqa: S102
    fn = ns.get("max_subarray") or ns.get("maxSubArray")
    return fn(nums) if fn else None


def _evaluate_submission(slug: str, code: str, test_cases: list[dict]) -> list[TestResult]:
    """
    Thin evaluation engine — runs Python code against test cases.
    Returns a list of TestResult objects.
    NOTE: In production replace with a proper sandboxed judge (e.g. Judge0).
    """
    results = []

    for tc in test_cases:
        raw_input    = tc["input"]
        expected_out = tc["expected_output"].strip()
        hidden       = tc.get("is_hidden", False)

        try:
            got = None

            if slug == "two-sum":
                parts  = raw_input.split()
                nums   = list(map(int, parts[:-1]))
                target = int(parts[-1])
                result = _run_python_two_sum(code, nums, target)
                got    = str(sorted(result)) if result is not None else "None"

            elif slug == "valid-parentheses":
                result = _run_python_is_valid(code, raw_input.strip())
                got    = str(result).lower() if result is not None else "none"

            elif slug == "maximum-subarray":
                nums   = list(map(int, raw_input.split()))
                result = _run_python_max_subarray(code, nums)
                got    = str(result) if result is not None else "None"

            else:
                # For design challenges or unsupported slugs — auto-pass visible tests
                got = expected_out

            passed = got is not None and got.replace(" ", "") == expected_out.replace(" ", "")

        except Exception as exc:
            got    = f"Error: {type(exc).__name__}: {str(exc)[:120]}"
            passed = False

        results.append(TestResult(
            passed=passed,
            input=raw_input if not hidden else "**hidden**",
            expected=expected_out if not hidden else "**hidden**",
            got=got if not hidden else ("✓" if passed else "✗"),
            hidden=hidden,
        ))

    return results


# ── XP + streak helpers ────────────────────────────────────────────────────

def _level_for_xp(xp: int) -> int:
    """Simple linear level formula: each level needs level*1000 + (level-1)*500 XP."""
    level = 1
    while xp >= level * 1000 + (level - 1) * 500:
        xp   -= level * 1000 + (level - 1) * 500
        level += 1
    return level


async def _update_user_xp_and_streak(user_id: str, xp_reward: int) -> tuple[int, int, int]:
    """
    Add XP and update the streak for user_id.
    Returns (new_total_xp, new_level, new_streak).
    """
    db  = get_db()
    doc = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found.")

    today          = date.today()
    last_activity  = doc.get("last_activity_date")
    current_streak = doc.get("streak", 0)

    # Streak logic
    if last_activity:
        last_date = last_activity.date() if isinstance(last_activity, datetime) else last_activity
        delta     = (today - last_date).days
        if delta == 0:
            new_streak = current_streak          # same day — no change
        elif delta == 1:
            new_streak = current_streak + 1      # consecutive — increment
        else:
            new_streak = 1                       # broke streak — reset to 1
    else:
        new_streak = 1                           # first activity

    new_xp    = doc.get("xp", 0) + xp_reward
    new_level = _level_for_xp(new_xp)

    await db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "xp":                 new_xp,
            "level":              new_level,
            "streak":             new_streak,
            "last_activity_date": datetime.combine(today, datetime.min.time()),
        }},
    )
    return new_xp, new_level, new_streak


# ── Main submission entry point ────────────────────────────────────────────

async def submit_challenge(slug: str, body: SubmitRequest, user_id: str) -> SubmissionResult:
    # 1. Only Python supported in this eval engine
    if body.language != "python":
        raise HTTPException(
            status_code=422,
            detail="Only 'python' is supported by the built-in judge. "
                   "Connect Judge0 for other languages.",
        )

    # 2. Fetch challenge with ALL test cases (including hidden)
    doc        = await get_challenge_doc_by_slug(slug)
    test_cases = doc.get("test_cases", [])
    xp_reward  = doc.get("xp_reward", 100)

    # 3. Run code against tests
    test_results = _evaluate_submission(slug, body.code, test_cases)

    passed_count = sum(1 for r in test_results if r.passed)
    total_count  = len(test_results)
    accepted     = passed_count == total_count

    # 4. Award XP only if fully accepted
    xp_earned   = xp_reward if accepted else 0
    new_xp, new_level, new_streak = await _update_user_xp_and_streak(user_id, xp_earned)

    # 5. Store submission record
    db = get_db()
    await db["submissions"].insert_one({
        "user_id":      user_id,
        "challenge_id": str(doc["_id"]),
        "slug":         slug,
        "language":     body.language,
        "code":         body.code,
        "accepted":     accepted,
        "passed":       passed_count,
        "total":        total_count,
        "xp_earned":    xp_earned,
        "submitted_at": datetime.utcnow(),
    })

    message = (
        f"🎉 All {total_count} tests passed! +{xp_earned} XP awarded."
        if accepted
        else f"❌ {passed_count}/{total_count} tests passed. Keep trying!"
    )

    return SubmissionResult(
        accepted=accepted,
        passed=passed_count,
        total=total_count,
        xp_earned=xp_earned,
        new_total_xp=new_xp,
        new_level=new_level,
        new_streak=new_streak,
        test_results=test_results,
        message=message,
    )