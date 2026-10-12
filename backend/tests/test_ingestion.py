from datetime import date
from decimal import Decimal
from app.ingestion import normalize_header, parse_price, parse_date


def test_normalize_header():
    assert normalize_header("Store ID") == "store_id"
    assert normalize_header("StoreID") == "store_id"
    assert normalize_header("STORE_CODE") == "store_id"
    assert normalize_header("SKU") == "sku"
    assert normalize_header("Product Name") == "product_name"
    assert normalize_header("Retail Price") == "price"
    assert normalize_header("Effective Date") == "price_date"


def test_parse_price():
    assert parse_price("49.99") == Decimal("49.99")
    assert parse_price("$1,299.50") == Decimal("1299.50")
    assert parse_price("€15.00") == Decimal("15.00")
    assert parse_price("£8.25") == Decimal("8.25")
    assert parse_price("0") is None
    assert parse_price("-10.50") is None
    assert parse_price("abc") is None
    assert parse_price("") is None


def test_parse_date():
    assert parse_date("2026-10-12") == date(2026, 10, 12)
    assert parse_date("2026/10/12") == date(2026, 10, 12)
    assert parse_date("10/12/2026") == date(2026, 10, 12)
    assert parse_date("25/12/2026") == date(2026, 12, 25)
    assert parse_date("invalid-date") is None
    assert parse_date("") is None
