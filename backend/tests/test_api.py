import io
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert "latency_ms" in data


def test_upload_csv_flow():
    csv_content = """Store ID,SKU,Product Name,Price,Date,Currency
STORE-TEST-1,SKU-UNIT-01,Test Wireless Charger 15W,29.99,2026-10-12,USD
STORE-TEST-1,SKU-UNIT-02,Test USB-C Braided Cable 2M,12.50,2026-10-12,USD
"""
    response = client.post(
        "/api/v1/upload",
        files={"file": ("test_feed.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    )
    assert response.status_code == 201
    job = response.json()
    assert job["total_rows"] == 2
    assert job["status"] == "COMPLETED"


def test_search_and_edit_pricing():
    res = client.get("/api/v1/pricing", params={"store_id": "STORE-TEST-1"})
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    record = data["items"][0]
    record_id = record["id"]

    edit_res = client.put(
        f"/api/v1/pricing/{record_id}",
        json={"price": 34.99, "reason": "Test unit price revision", "modified_by": "Test Suite"}
    )
    assert edit_res.status_code == 200
    updated = edit_res.json()
    assert float(updated["price"]) == 34.99
    assert len(updated["audit_logs"]) >= 1

    latest_audit = updated["audit_logs"][-1]
    assert float(latest_audit["new_price"]) == 34.99
    assert latest_audit["modified_by"] == "Test Suite"


def test_validation_negative_price():
    res = client.get("/api/v1/pricing", params={"page_size": 1})
    if res.status_code == 200 and res.json()["total"] > 0:
        record_id = res.json()["items"][0]["id"]
        bad_edit = client.put(
            f"/api/v1/pricing/{record_id}",
            json={"price": -50.00}
        )
        assert bad_edit.status_code == 422


def test_create_and_delete_pricing_record():
    payload = {
        "store_id": "STORE-CRUD-TEST",
        "sku": "SKU-CRUD-9999",
        "product_name": "CRUD Test Product Wireless Mouse",
        "price": 49.95,
        "currency": "USD",
        "price_date": "2026-10-12"
    }
    create_res = client.post("/api/v1/pricing", json=payload)
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["store_id"] == "STORE-CRUD-TEST"
    assert created["sku"] == "SKU-CRUD-9999"
    assert float(created["price"]) == 49.95
    assert len(created["audit_logs"]) >= 1
    record_id = created["id"]

    del_res = client.delete(f"/api/v1/pricing/{record_id}")
    assert del_res.status_code == 204

    get_res = client.get(f"/api/v1/pricing/{record_id}")
    assert get_res.status_code == 404


def test_stats_endpoint():
    res = client.get("/api/v1/stats")
    assert res.status_code == 200
    data = res.json()
    assert "total_records" in data
    assert "active_stores_count" in data
    assert "unique_skus_count" in data
    assert "avg_price" in data


def test_upload_jobs_history():
    res = client.get("/api/v1/jobs")
    assert res.status_code == 200
    jobs = res.json()
    assert isinstance(jobs, list)


def test_unique_stores_list():
    res = client.get("/api/v1/pricing/stores/list")
    assert res.status_code == 200
    stores = res.json()
    assert isinstance(stores, list)


def test_upload_preview_flow():
    csv_content = """Store ID,SKU,Product Name,Price,Date
STORE-PREV-1,SKU-PREV-01,Preview Item,19.99,2026-10-12
"""
    res = client.post(
        "/api/v1/upload/preview",
        files={"file": ("preview.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    )
    assert res.status_code == 200
    data = res.json()
    assert "headers" in data
    assert "preview_rows" in data
    assert len(data["preview_rows"]) == 1


def test_duplicate_create_upsert_flow():
    payload = {
        "store_id": "STORE-DUP-TEST",
        "sku": "SKU-DUP-01",
        "product_name": "Duplicate Test Initial",
        "price": 25.00,
        "currency": "USD",
        "price_date": "2026-10-12"
    }
    r1 = client.post("/api/v1/pricing", json=payload)
    assert r1.status_code == 201
    rec1 = r1.json()
    rec_id = rec1["id"]

    payload_dup = {
        "store_id": "STORE-DUP-TEST",
        "sku": "SKU-DUP-01",
        "product_name": "Duplicate Test Updated",
        "price": 29.99,
        "currency": "USD",
        "price_date": "2026-10-12"
    }
    r2 = client.post("/api/v1/pricing", json=payload_dup)
    assert r2.status_code == 201
    rec2 = r2.json()
    assert rec2["id"] == rec_id
    assert float(rec2["price"]) == 29.99

    client.delete(f"/api/v1/pricing/{rec_id}")


