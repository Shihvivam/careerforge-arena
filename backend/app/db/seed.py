"""
app/db/seed.py
Seeds the `challenges` collection with starter problems.
Run once: python -m app.db.seed
"""

import asyncio
from datetime import datetime
from app.db.mongo import connect_db, close_db, get_db


CHALLENGES = [
    {
        "title": "Two Sum",
        "slug": "two-sum",
        "difficulty": "easy",
        "category": "algorithms",
        "tags": ["array", "hash-map", "classic"],
        "description": """## Two Sum

Given an array of integers `nums` and an integer `target`, return the **indices** of the two numbers that add up to `target`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.""",
        "examples": [
            {"input": "nums = [2,7,11,15], target = 9", "output": "[0,1]", "explanation": "nums[0] + nums[1] = 2 + 7 = 9"},
            {"input": "nums = [3,2,4], target = 6",      "output": "[1,2]", "explanation": "nums[1] + nums[2] = 2 + 4 = 6"},
        ],
        "constraints": ["2 ≤ nums.length ≤ 10⁴", "-10⁹ ≤ nums[i] ≤ 10⁹", "Only one valid answer exists"],
        "starter_code": {
            "python": "def two_sum(nums: list[int], target: int) -> list[int]:\n    # Your solution here\n    pass\n",
            "javascript": "function twoSum(nums, target) {\n  // Your solution here\n}\n",
        },
        "test_cases": [
            {"input": "[2,7,11,15] 9",  "expected_output": "[0, 1]", "is_hidden": False},
            {"input": "[3,2,4] 6",      "expected_output": "[1, 2]", "is_hidden": False},
            {"input": "[3,3] 6",        "expected_output": "[0, 1]", "is_hidden": True},
            {"input": "[1,2,3,4] 7",    "expected_output": "[2, 3]", "is_hidden": True},
        ],
        "xp_reward": 120,
        "created_at": datetime.utcnow(),
    },
    {
        "title": "Valid Parentheses",
        "slug": "valid-parentheses",
        "difficulty": "easy",
        "category": "data-structures",
        "tags": ["stack", "string", "classic"],
        "description": """## Valid Parentheses

Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is **valid**.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.""",
        "examples": [
            {"input": 's = "()"',      "output": "true",  "explanation": "Simple matching pair"},
            {"input": 's = "()[]{}"',  "output": "true",  "explanation": "All pairs match"},
            {"input": 's = "(]"',      "output": "false", "explanation": "Mismatched brackets"},
        ],
        "constraints": ["1 ≤ s.length ≤ 10⁴", "s consists of parentheses only '()[]{}'"],
        "starter_code": {
            "python": "def is_valid(s: str) -> bool:\n    # Your solution here\n    pass\n",
            "javascript": "function isValid(s) {\n  // Your solution here\n}\n",
        },
        "test_cases": [
            {"input": "()",       "expected_output": "true",  "is_hidden": False},
            {"input": "()[]{}",   "expected_output": "true",  "is_hidden": False},
            {"input": "(]",       "expected_output": "false", "is_hidden": False},
            {"input": "([)]",     "expected_output": "false", "is_hidden": True},
            {"input": "{[]}",     "expected_output": "true",  "is_hidden": True},
        ],
        "xp_reward": 120,
        "created_at": datetime.utcnow(),
    },
    {
        "title": "Maximum Subarray",
        "slug": "maximum-subarray",
        "difficulty": "medium",
        "category": "algorithms",
        "tags": ["dynamic-programming", "array", "kadane"],
        "description": """## Maximum Subarray

Given an integer array `nums`, find the **subarray** with the largest sum, and return its sum.

A **subarray** is a contiguous non-empty sequence of elements within an array.""",
        "examples": [
            {"input": "nums = [-2,1,-3,4,-1,2,1,-5,4]", "output": "6",  "explanation": "Subarray [4,-1,2,1] has the largest sum = 6"},
            {"input": "nums = [1]",                       "output": "1",  "explanation": "Single element"},
            {"input": "nums = [5,4,-1,7,8]",              "output": "23", "explanation": "Entire array"},
        ],
        "constraints": ["1 ≤ nums.length ≤ 10⁵", "-10⁴ ≤ nums[i] ≤ 10⁴"],
        "starter_code": {
            "python": "def max_subarray(nums: list[int]) -> int:\n    # Hint: Kadane's algorithm\n    pass\n",
            "javascript": "function maxSubArray(nums) {\n  // Hint: Kadane's algorithm\n}\n",
        },
        "test_cases": [
            {"input": "-2 1 -3 4 -1 2 1 -5 4", "expected_output": "6",  "is_hidden": False},
            {"input": "1",                       "expected_output": "1",  "is_hidden": False},
            {"input": "5 4 -1 7 8",             "expected_output": "23", "is_hidden": True},
            {"input": "-1 -2 -3",               "expected_output": "-1", "is_hidden": True},
        ],
        "xp_reward": 250,
        "created_at": datetime.utcnow(),
    },
    {
        "title": "LRU Cache",
        "slug": "lru-cache",
        "difficulty": "medium",
        "category": "data-structures",
        "tags": ["linked-list", "hash-map", "design"],
        "description": """## LRU Cache

Design a data structure that follows the constraints of a **Least Recently Used (LRU) cache**.

Implement the `LRUCache` class:
- `LRUCache(int capacity)` — Initialize the LRU cache with positive size `capacity`.
- `int get(int key)` — Return the value if the key exists, otherwise return `-1`.
- `void put(int key, int value)` — Update the value if the key exists. Otherwise, add the key-value pair. If the number of keys exceeds `capacity`, evict the least recently used key.

Both operations must run in **O(1)** average time complexity.""",
        "examples": [
            {"input": '["LRUCache","put","put","get","put","get","put","get","get","get"]\n[[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]', "output": '[null,null,null,1,null,-1,null,-1,3,4]', "explanation": "Capacity 2 LRU cache operations"},
        ],
        "constraints": ["1 ≤ capacity ≤ 3000", "0 ≤ key ≤ 10⁴", "0 ≤ value ≤ 10⁵", "At most 2 × 10⁵ calls to get and put"],
        "starter_code": {
            "python": "from collections import OrderedDict\n\nclass LRUCache:\n    def __init__(self, capacity: int):\n        pass\n\n    def get(self, key: int) -> int:\n        pass\n\n    def put(self, key: int, value: int) -> None:\n        pass\n",
            "javascript": "class LRUCache {\n  constructor(capacity) {\n    // Your solution here\n  }\n  get(key) {}\n  put(key, value) {}\n}\n",
        },
        "test_cases": [
            {"input": "2 [[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]", "expected_output": "[1,-1,-1,3,4]", "is_hidden": False},
        ],
        "xp_reward": 250,
        "created_at": datetime.utcnow(),
    },
    {
        "title": "Word Search",
        "slug": "word-search",
        "difficulty": "hard",
        "category": "algorithms",
        "tags": ["backtracking", "matrix", "dfs"],
        "description": """## Word Search

Given an `m × n` grid of characters `board` and a string `word`, return `true` if `word` exists in the grid.

The word can be constructed from letters of sequentially **adjacent cells**, where adjacent cells are horizontally or vertically neighboring. The **same letter cell may not be used more than once**.""",
        "examples": [
            {"input": 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"', "output": "true",  "explanation": "Path found"},
            {"input": 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "SEE"',    "output": "true",  "explanation": "Path found"},
            {"input": 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCB"',   "output": "false", "explanation": "Cannot reuse B"},
        ],
        "constraints": ["m == board.length", "n == board[i].length", "1 ≤ m, n ≤ 6", "1 ≤ word.length ≤ 15"],
        "starter_code": {
            "python": "def exist(board: list[list[str]], word: str) -> bool:\n    # Hint: DFS + backtracking\n    pass\n",
            "javascript": "function exist(board, word) {\n  // Hint: DFS + backtracking\n}\n",
        },
        "test_cases": [
            {"input": 'ABCE/SFCS/ADEE ABCCED', "expected_output": "true",  "is_hidden": False},
            {"input": 'ABCE/SFCS/ADEE SEE',    "expected_output": "true",  "is_hidden": True},
            {"input": 'ABCE/SFCS/ADEE ABCB',   "expected_output": "false", "is_hidden": True},
        ],
        "xp_reward": 500,
        "created_at": datetime.utcnow(),
    },
    {
        "title": "Design URL Shortener",
        "slug": "design-url-shortener",
        "difficulty": "hard",
        "category": "system-design",
        "tags": ["system-design", "hashing", "scalability", "databases"],
        "description": """## Design a URL Shortener

Design a system like **bit.ly** or **tinyurl.com** that can shorten long URLs and redirect users.

### Requirements
**Functional:**
- Given a long URL, generate a unique short URL (e.g. `short.ly/abc123`)
- Redirect short URL → original URL with < 10ms latency
- Support ~100M URLs stored

**Non-functional:**
- High availability (99.99% uptime)
- Read-heavy (100:1 read-to-write ratio)
- Analytics: track click counts per URL

### Your Task
Write a structured design covering:
1. **API Design** — endpoints and contracts
2. **Data Model** — schema and database choice
3. **Encoding Strategy** — how you generate short codes
4. **Scaling** — caching, sharding, replication
5. **Trade-offs** — what you'd do differently at 10x scale""",
        "examples": [
            {"input": "POST /shorten { url: 'https://very-long-url.com/path' }", "output": "{ short_url: 'short.ly/x7k2pQ' }", "explanation": "Shorten a URL"},
            {"input": "GET /x7k2pQ", "output": "301 Redirect → original URL", "explanation": "Redirect flow"},
        ],
        "constraints": ["Short code must be ≤ 7 characters", "Must handle 1000 writes/sec", "Must handle 100,000 reads/sec"],
        "starter_code": {
            "python": "# System Design — write your approach as comments/pseudocode\n\n# 1. API Design:\n#    POST /api/shorten  -> { short_url }\n#    GET  /{code}       -> 301 redirect\n#    GET  /api/stats/{code} -> { clicks, created_at }\n\n# 2. Data Model:\n#    urls collection: { _id, long_url, short_code, user_id, clicks, created_at }\n\n# 3. Encoding Strategy:\n#    - MD5 hash of long_url + base62 encode first 7 chars\n\n# 4. Scaling:\n#    - Redis cache for hot short codes\n#    - CDN for redirect responses\n\n# Write your implementation below:\nclass URLShortener:\n    def __init__(self):\n        self.db = {}   # in-memory for this exercise\n\n    def shorten(self, long_url: str) -> str:\n        pass\n\n    def resolve(self, short_code: str) -> str:\n        pass\n",
            "javascript": "// System Design — URL Shortener\nclass URLShortener {\n  constructor() {\n    this.db = new Map();\n  }\n  shorten(longUrl) { /* implement */ }\n  resolve(shortCode) { /* implement */ }\n}\n",
        },
        "test_cases": [
            {"input": "shorten https://example.com/very/long/path", "expected_output": "7-char code", "is_hidden": False},
        ],
        "xp_reward": 500,
        "created_at": datetime.utcnow(),
    },
]


async def seed():
    await connect_db()
    db = get_db()

    collection = db["challenges"]
    existing = await collection.count_documents({})

    if existing >= len(CHALLENGES):
        print(f"[Seed] Already have {existing} challenges — skipping.")
        await close_db()
        return

    # Upsert by slug so re-running is safe
    for ch in CHALLENGES:
        await collection.update_one(
            {"slug": ch["slug"]},
            {"$setOnInsert": ch},
            upsert=True,
        )
        print(f"[Seed] ✓ {ch['title']}")

    # Create indexes
    from pymongo import ASCENDING
    await collection.create_index([("slug", ASCENDING)], unique=True)
    await collection.create_index([("difficulty", ASCENDING)])
    await collection.create_index([("category", ASCENDING)])

    total = await collection.count_documents({})
    print(f"[Seed] Done — {total} challenges in DB.")
    await close_db()


if __name__ == "__main__":
    asyncio.run(seed())