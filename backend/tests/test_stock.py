import pytest

from tests.conftest import auth_headers


async def _create_product(client, admin_user, name="Widget") -> str:
    resp = await client.post(
        "/products",
        json={"name": name, "category": "Test", "low_stock_threshold": 5},
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 201
    return resp.json()["id"]


async def test_new_product_has_zero_quantity(client, admin_user):
    product_id = await _create_product(client, admin_user)

    resp = await client.get("/products", headers=auth_headers(admin_user))
    assert resp.status_code == 200
    product = next(p for p in resp.json() if p["id"] == product_id)
    assert product["quantity"] == 0


async def test_quantity_is_sum_of_transactions(client, admin_user):
    product_id = await _create_product(client, admin_user)

    for change in (10, 5, -3):
        resp = await client.post(
            f"/stock/{product_id}/transaction",
            json={"change_quantity": change, "reason": "test"},
            headers=auth_headers(admin_user),
        )
        assert resp.status_code == 201

    resp = await client.get("/products", headers=auth_headers(admin_user))
    product = next(p for p in resp.json() if p["id"] == product_id)
    assert product["quantity"] == 12  # 10 + 5 - 3

    history = await client.get(f"/stock/{product_id}/history", headers=auth_headers(admin_user))
    assert history.status_code == 200
    assert len(history.json()) == 3


async def test_stock_out_blocked_when_it_would_go_negative(client, admin_user):
    product_id = await _create_product(client, admin_user)

    resp = await client.post(
        f"/stock/{product_id}/transaction",
        json={"change_quantity": 5, "reason": "initial stock"},
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 201

    resp = await client.post(
        f"/stock/{product_id}/transaction",
        json={"change_quantity": -6, "reason": "too much"},
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 400
    assert "rejected" in resp.json()["detail"].lower()

    # quantity must be unaffected by the rejected transaction
    resp = await client.get("/products", headers=auth_headers(admin_user))
    product = next(p for p in resp.json() if p["id"] == product_id)
    assert product["quantity"] == 5


async def test_stock_out_to_exactly_zero_is_allowed(client, admin_user):
    product_id = await _create_product(client, admin_user)

    await client.post(
        f"/stock/{product_id}/transaction",
        json={"change_quantity": 5},
        headers=auth_headers(admin_user),
    )
    resp = await client.post(
        f"/stock/{product_id}/transaction",
        json={"change_quantity": -5},
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 201


async def test_employee_cannot_create_product(client, employee_user):
    resp = await client.post(
        "/products",
        json={"name": "Widget", "category": "Test"},
        headers=auth_headers(employee_user),
    )
    assert resp.status_code == 403


async def test_employee_cannot_edit_product(client, admin_user, employee_user):
    product_id = await _create_product(client, admin_user)
    resp = await client.put(
        f"/products/{product_id}",
        json={"name": "Renamed", "category": "Test"},
        headers=auth_headers(employee_user),
    )
    assert resp.status_code == 403


async def test_employee_cannot_delete_product(client, admin_user, employee_user):
    product_id = await _create_product(client, admin_user)
    resp = await client.delete(f"/products/{product_id}", headers=auth_headers(employee_user))
    assert resp.status_code == 403


async def test_manager_cannot_delete_product(client, admin_user, manager_user):
    product_id = await _create_product(client, admin_user)
    resp = await client.delete(f"/products/{product_id}", headers=auth_headers(manager_user))
    assert resp.status_code == 403


async def test_admin_can_delete_product_without_transactions(client, admin_user):
    product_id = await _create_product(client, admin_user)
    resp = await client.delete(f"/products/{product_id}", headers=auth_headers(admin_user))
    assert resp.status_code == 204


async def test_employee_cannot_record_stock_transaction(client, admin_user, employee_user):
    product_id = await _create_product(client, admin_user)
    resp = await client.post(
        f"/stock/{product_id}/transaction",
        json={"change_quantity": 10},
        headers=auth_headers(employee_user),
    )
    assert resp.status_code == 403


async def test_employee_cannot_view_products_or_history(client, admin_user, employee_user):
    product_id = await _create_product(client, admin_user)

    resp = await client.get("/products", headers=auth_headers(employee_user))
    assert resp.status_code == 403

    resp = await client.get(f"/stock/{product_id}/history", headers=auth_headers(employee_user))
    assert resp.status_code == 403


async def test_manager_cannot_view_products_or_history(client, admin_user, manager_user):
    product_id = await _create_product(client, admin_user)

    resp = await client.get("/products", headers=auth_headers(manager_user))
    assert resp.status_code == 403

    resp = await client.get(f"/stock/{product_id}/history", headers=auth_headers(manager_user))
    assert resp.status_code == 403


async def test_manager_cannot_create_product(client, manager_user):
    resp = await client.post(
        "/products",
        json={"name": "Manager Widget", "category": "Test"},
        headers=auth_headers(manager_user),
    )
    assert resp.status_code == 403


async def test_manager_cannot_record_stock_transaction(client, admin_user, manager_user):
    product_id = await _create_product(client, admin_user)
    resp = await client.post(
        f"/stock/{product_id}/transaction",
        json={"change_quantity": 20},
        headers=auth_headers(manager_user),
    )
    assert resp.status_code == 403


async def test_manager_can_list_assignable_products(client, admin_user, manager_user):
    product_id = await _create_product(client, admin_user, name="Assignable Widget")
    resp = await client.get("/products/assignable", headers=auth_headers(manager_user))
    assert resp.status_code == 200
    ids = {p["id"] for p in resp.json()}
    assert product_id in ids
    # narrower shape than full ProductOut — no quantity/supplier fields
    assert set(resp.json()[0].keys()) == {"id", "name"}


async def test_employee_cannot_list_assignable_products(client, admin_user, employee_user):
    await _create_product(client, admin_user)
    resp = await client.get("/products/assignable", headers=auth_headers(employee_user))
    assert resp.status_code == 403
