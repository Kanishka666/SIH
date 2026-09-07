"""
In-memory data store.

IMPORTANT (read this before adding a real database):
------------------------------------------------------
This module is the ONLY place that "knows" data is currently stored in
plain Python dicts. Every service (auth_service, scan_service,
report_service, etc.) talks to the functions in this file instead of
touching dictionaries directly.

When PostgreSQL/MongoDB is introduced, this file can be replaced by a
module with the SAME function names (e.g. get_user_by_email,
create_scan, get_scan, ...) but backed by real queries (SQLAlchemy /
Motor / etc.). The rest of the codebase (routes + services) should
require little to no change.

All data here is lost when the server restarts. That's expected for
this MVP milestone.
"""
from datetime import datetime, timezone
from itertools import count
from threading import Lock
from typing import Dict, List, Optional

# ---------------------------------------------------------------------------
# In-memory "tables"
# ---------------------------------------------------------------------------
_users: Dict[str, dict] = {}          # keyed by user id
_users_by_email: Dict[str, str] = {}  # email -> user id

_scans: Dict[str, dict] = {}          # keyed by scan id
_products: Dict[str, dict] = {}       # keyed by product id
_cases: Dict[str, dict] = {}          # keyed by case id
_rules: Dict[str, dict] = {}          # keyed by rule id

_lock = Lock()  # simple guard since dict ops aren't atomic across awaits

_user_id_counter = count(1)
_scan_id_counter = count(1)
_product_id_counter = count(1)
_case_id_counter = count(1)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------
def create_user(name: str, email: str, hashed_password: str, role: str) -> dict:
    with _lock:
        if email in _users_by_email:
            raise ValueError("Email already registered")
        user_id = f"user_{next(_user_id_counter)}"
        user = {
            "id": user_id,
            "name": name,
            "email": email,
            "hashed_password": hashed_password,
            "role": role,
            "created_at": _now_iso(),
        }
        _users[user_id] = user
        _users_by_email[email] = user_id
        return user


def get_user_by_email(email: str) -> Optional[dict]:
    user_id = _users_by_email.get(email)
    return _users.get(user_id) if user_id else None


def get_user_by_id(user_id: str) -> Optional[dict]:
    return _users.get(user_id)


# ---------------------------------------------------------------------------
# Scans
# ---------------------------------------------------------------------------
def create_scan(owner_id: str, filename: str, file_path: str, content_type: str) -> dict:
    with _lock:
        scan_id = f"scan_{next(_scan_id_counter)}"
        scan = {
            "id": scan_id,
            "owner_id": owner_id,
            "filename": filename,
            "file_path": file_path,
            "content_type": content_type,
            "status": "processing",
            "progress": 10,
            "created_at": _now_iso(),
            "result": None,  # populated once mock processing "completes"
        }
        _scans[scan_id] = scan
        return scan


def get_scan(scan_id: str) -> Optional[dict]:
    return _scans.get(scan_id)


def update_scan(scan_id: str, **fields) -> Optional[dict]:
    scan = _scans.get(scan_id)
    if not scan:
        return None
    scan.update(fields)
    return scan


def list_scans(owner_id: Optional[str] = None) -> List[dict]:
    scans = list(_scans.values())
    if owner_id:
        scans = [s for s in scans if s["owner_id"] == owner_id]
    return scans


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------
def create_product(data: dict) -> dict:
    with _lock:
        product_id = f"prod_{next(_product_id_counter)}"
        product = {"id": product_id, "created_at": _now_iso(), **data}
        _products[product_id] = product
        return product


def list_products() -> List[dict]:
    return list(_products.values())


def get_product(product_id: str) -> Optional[dict]:
    return _products.get(product_id)


# ---------------------------------------------------------------------------
# Cases
# ---------------------------------------------------------------------------
def create_case(data: dict) -> dict:
    with _lock:
        case_id = f"case_{next(_case_id_counter)}"
        case = {"id": case_id, "created_at": _now_iso(), **data}
        _cases[case_id] = case
        return case


def list_cases() -> List[dict]:
    return list(_cases.values())


def get_case(case_id: str) -> Optional[dict]:
    return _cases.get(case_id)


# ---------------------------------------------------------------------------
# Rules (seeded with placeholder/demo data — see mock_ai_service.py)
# ---------------------------------------------------------------------------
def seed_rules(rules: List[dict]) -> None:
    for rule in rules:
        _rules[rule["id"]] = rule


def list_rules() -> List[dict]:
    return list(_rules.values())


def get_rule(rule_id: str) -> Optional[dict]:
    return _rules.get(rule_id)


# ---------------------------------------------------------------------------
# Seed some demo products/cases so GET endpoints aren't empty on first run
# ---------------------------------------------------------------------------
def seed_demo_data() -> None:
    if not _products:
        create_product(
            {
                "name": "Demo Packaged Atta 1kg",
                "category": "Food & Grocery",
                "manufacturer": "ABC Foods Pvt Ltd",
                "net_quantity": "1 kg",
                "mrp": "₹55",
            }
        )
        create_product(
            {
                "name": "Demo Herbal Soap 100g",
                "category": "Personal Care",
                "manufacturer": "XYZ Cosmetics Ltd",
                "net_quantity": "100 g",
                "mrp": "₹45",
            }
        )
    if not _cases:
        create_case(
            {
                "scan_id": None,
                "title": "Demo case — MRP not declared",
                "status": "open",
                "assigned_to": "inspector_demo",
                "notes": "Auto-seeded demo case for MVP testing.",
            }
        )
