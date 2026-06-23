"""Integration tests for /applications routes."""

import pytest
from httpx import AsyncClient


pytestmark = pytest.mark.asyncio


async def _create_app(client: AsyncClient, **overrides) -> dict:
    payload = {
        "company": "Acme",
        "role": "Engineer",
        "job_description": "Build things",
        **overrides,
    }
    resp = await client.post("/applications", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------


async def test_create_application(client):
    data = await _create_app(client)
    assert data["company"] == "Acme"
    assert data["status"] == "applied"
    assert data["id"] is not None


async def test_list_applications_empty(client):
    resp = await client.get("/applications")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_list_applications(client):
    await _create_app(client, company="Alpha")
    await _create_app(client, company="Beta")
    resp = await client.get("/applications")
    assert len(resp.json()) == 2


async def test_list_applications_filter_status(client):
    await _create_app(client, status="applied")
    await _create_app(client, status="offer")
    resp = await client.get("/applications?status=offer")
    results = resp.json()
    assert len(results) == 1
    assert results[0]["status"] == "offer"


async def test_list_applications_filter_company(client):
    await _create_app(client, company="Google")
    await _create_app(client, company="Meta")
    resp = await client.get("/applications?company=goo")
    results = resp.json()
    assert len(results) == 1
    assert results[0]["company"] == "Google"


async def test_get_application(client):
    created = await _create_app(client)
    resp = await client.get(f"/applications/{created['id']}")
    assert resp.status_code == 200
    assert resp.json()["id"] == created["id"]


async def test_get_application_not_found(client):
    resp = await client.get("/applications/9999")
    assert resp.status_code == 404


async def test_update_application_status(client):
    created = await _create_app(client)
    resp = await client.put(
        f"/applications/{created['id']}", json={"status": "offer"}
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "offer"


async def test_update_application_notes(client):
    created = await _create_app(client)
    resp = await client.put(
        f"/applications/{created['id']}", json={"notes": "Great opportunity"}
    )
    assert resp.status_code == 200
    assert resp.json()["notes"] == "Great opportunity"


async def test_update_application_not_found(client):
    resp = await client.put("/applications/9999", json={"status": "offer"})
    assert resp.status_code == 404


async def test_delete_application(client):
    created = await _create_app(client)
    resp = await client.delete(f"/applications/{created['id']}")
    assert resp.status_code == 204
    resp2 = await client.get(f"/applications/{created['id']}")
    assert resp2.status_code == 404


async def test_delete_application_not_found(client):
    resp = await client.delete("/applications/9999")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Sankey data
# ---------------------------------------------------------------------------


async def test_sankey_data_empty(client):
    resp = await client.get("/applications/sankey-data")
    assert resp.status_code == 200
    assert resp.json() == {"nodes": [], "links": []}


async def test_sankey_data_with_transitions(client):
    created = await _create_app(client)
    await client.put(f"/applications/{created['id']}", json={"status": "phone_screen"})
    resp = await client.get("/applications/sankey-data")
    body = resp.json()
    assert len(body["nodes"]) > 0
    assert len(body["links"]) > 0


# ---------------------------------------------------------------------------
# CSV import
# ---------------------------------------------------------------------------

_CSV_HEADER = "Company,Role,Stage,Date,Job Posting Link,Notes,Location,Salary Range\n"


async def test_import_csv_basic(client):
    csv_content = _CSV_HEADER + "Stripe,Engineer,applied,2024-01-15,https://stripe.com,,SF,\n"
    resp = await client.post(
        "/applications/import-csv",
        files={"file": ("apps.csv", csv_content.encode(), "text/csv")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["imported"] == 1
    assert body["skipped"] == 0


async def test_import_csv_missing_company_skipped(client):
    csv_content = _CSV_HEADER + ",Engineer,applied,2024-01-15,,,\n"
    resp = await client.post(
        "/applications/import-csv",
        files={"file": ("apps.csv", csv_content.encode(), "text/csv")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["imported"] == 0
    assert body["skipped"] == 1


async def test_import_csv_status_normalization(client):
    csv_content = _CSV_HEADER + "Acme,Dev,phone screen,2024-01-15,,,\n"
    resp = await client.post(
        "/applications/import-csv",
        files={"file": ("apps.csv", csv_content.encode(), "text/csv")},
    )
    assert resp.status_code == 200
    assert resp.json()["imported"] == 1
    apps = (await client.get("/applications")).json()
    assert apps[0]["status"] == "phone_screen"


async def test_import_csv_wrong_extension(client):
    resp = await client.post(
        "/applications/import-csv",
        files={"file": ("apps.txt", b"data", "text/plain")},
    )
    assert resp.status_code == 400


async def test_import_csv_multiple_rows(client):
    rows = "".join(
        f"Company{i},Eng,applied,2024-01-0{i+1},,,\n" for i in range(1, 4)
    )
    csv_content = _CSV_HEADER + rows
    resp = await client.post(
        "/applications/import-csv",
        files={"file": ("apps.csv", csv_content.encode(), "text/csv")},
    )
    assert resp.status_code == 200
    assert resp.json()["imported"] == 3
