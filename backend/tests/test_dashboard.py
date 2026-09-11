from tests.conftest import auth_headers


async def _create_product(client, admin_user, name="Widget", threshold=5) -> str:
    resp = await client.post(
        "/products",
        json={"name": name, "category": "Test", "low_stock_threshold": threshold},
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 201
    return resp.json()["id"]


async def _create_asset(client, admin_user, product_id, asset_tag) -> str:
    resp = await client.post(
        "/assets",
        json={"asset_tag": asset_tag, "product_id": product_id},
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 201
    return resp.json()["id"]


async def test_dashboard_counts_are_correct(client, admin_user, employee_user):
    # one product above threshold, one product at/below threshold (low stock)
    healthy_product = await _create_product(client, admin_user, "Healthy", threshold=5)
    low_product = await _create_product(client, admin_user, "Low", threshold=10)

    await client.post(
        f"/stock/{healthy_product}/transaction",
        json={"change_quantity": 50},
        headers=auth_headers(admin_user),
    )
    await client.post(
        f"/stock/{low_product}/transaction",
        json={"change_quantity": 3},
        headers=auth_headers(admin_user),
    )

    asset1 = await _create_asset(client, admin_user, healthy_product, "AST-D1")
    await _create_asset(client, admin_user, healthy_product, "AST-D2")

    await client.post(
        f"/assets/{asset1}/assign",
        json={"employee_id": str(employee_user.id)},
        headers=auth_headers(admin_user),
    )

    resp = await client.get("/dashboard/summary", headers=auth_headers(admin_user))
    assert resp.status_code == 200
    data = resp.json()

    assert data["total_products"] == 2
    assert data["low_stock_count"] == 1  # only "Low" (3 <= 10)
    assert data["total_assets"] == 2
    assert data["assigned_assets_count"] == 1


async def test_dashboard_low_stock_includes_zero_quantity_product(client, admin_user):
    # a product with no stock transactions at all: quantity 0 <= any threshold >= 0
    await _create_product(client, admin_user, "Untouched", threshold=5)

    resp = await client.get("/dashboard/summary", headers=auth_headers(admin_user))
    assert resp.status_code == 200
    assert resp.json()["low_stock_count"] == 1


async def test_recent_activity_includes_both_types_sorted(client, admin_user, employee_user):
    product_id = await _create_product(client, admin_user)
    asset_id = await _create_asset(client, admin_user, product_id, "AST-ACT")

    await client.post(
        f"/stock/{product_id}/transaction",
        json={"change_quantity": 10, "reason": "first"},
        headers=auth_headers(admin_user),
    )
    await client.post(
        f"/assets/{asset_id}/assign",
        json={"employee_id": str(employee_user.id)},
        headers=auth_headers(admin_user),
    )
    await client.post(
        f"/stock/{product_id}/transaction",
        json={"change_quantity": 5, "reason": "second"},
        headers=auth_headers(admin_user),
    )

    resp = await client.get("/dashboard/summary", headers=auth_headers(admin_user))
    assert resp.status_code == 200
    activity = resp.json()["recent_activity"]

    types_present = {item["type"] for item in activity}
    assert types_present == {"stock_transaction", "asset_history"}
    assert len(activity) == 3

    # sorted by created_at descending
    timestamps = [item["created_at"] for item in activity]
    assert timestamps == sorted(timestamps, reverse=True)

    # most recent entry should be the second stock transaction
    assert activity[0]["type"] == "stock_transaction"
    assert activity[0]["reason"] == "second"


async def test_employee_cannot_access_dashboard(client, employee_user):
    resp = await client.get("/dashboard/summary", headers=auth_headers(employee_user))
    assert resp.status_code == 403


async def test_manager_can_access_dashboard(client, manager_user):
    resp = await client.get("/dashboard/summary", headers=auth_headers(manager_user))
    assert resp.status_code == 200
