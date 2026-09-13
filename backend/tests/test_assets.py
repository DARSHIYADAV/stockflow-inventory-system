from tests.conftest import auth_headers


async def _create_product(client, admin_user, name="Laptop") -> str:
    resp = await client.post(
        "/products",
        json={"name": name, "category": "Laptop"},
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 201
    return resp.json()["id"]


async def _create_asset(client, admin_user, product_id, asset_tag="AST-001") -> str:
    resp = await client.post(
        "/assets",
        json={"asset_tag": asset_tag, "product_id": product_id},
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 201
    return resp.json()["id"]


async def test_new_asset_is_available(client, admin_user):
    product_id = await _create_product(client, admin_user)
    asset_id = await _create_asset(client, admin_user, product_id)

    resp = await client.get("/assets", headers=auth_headers(admin_user))
    asset = next(a for a in resp.json() if a["id"] == asset_id)
    assert asset["status"] == "available"
    assert asset["assigned_to"] is None


async def test_assign_sets_status_and_employee(client, admin_user, employee_user):
    product_id = await _create_product(client, admin_user)
    asset_id = await _create_asset(client, admin_user, product_id)

    resp = await client.post(
        f"/assets/{asset_id}/assign",
        json={"employee_id": str(employee_user.id), "note": "onboarding"},
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "assigned"
    assert body["assigned_to"] == str(employee_user.id)


async def test_assign_blocked_if_not_available(client, admin_user, employee_user):
    product_id = await _create_product(client, admin_user)
    asset_id = await _create_asset(client, admin_user, product_id)

    resp = await client.post(
        f"/assets/{asset_id}/assign",
        json={"employee_id": str(employee_user.id)},
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 200

    # already assigned -> second assign attempt must be rejected
    resp = await client.post(
        f"/assets/{asset_id}/assign",
        json={"employee_id": str(employee_user.id)},
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 400
    assert "available" in resp.json()["detail"].lower()


async def test_return_blocked_if_not_assigned(client, admin_user):
    product_id = await _create_product(client, admin_user)
    asset_id = await _create_asset(client, admin_user, product_id)

    # asset is still "available", never assigned
    resp = await client.post(
        f"/assets/{asset_id}/return",
        json={"note": "returning"},
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 400
    assert "assigned" in resp.json()["detail"].lower()


async def test_return_sets_status_available_and_clears_employee(client, admin_user, employee_user):
    product_id = await _create_product(client, admin_user)
    asset_id = await _create_asset(client, admin_user, product_id)

    await client.post(
        f"/assets/{asset_id}/assign",
        json={"employee_id": str(employee_user.id)},
        headers=auth_headers(admin_user),
    )

    resp = await client.post(
        f"/assets/{asset_id}/return",
        json={"note": "laptop returned"},
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "available"
    assert body["assigned_to"] is None


async def test_assign_and_return_write_history_rows(client, admin_user, employee_user):
    product_id = await _create_product(client, admin_user)
    asset_id = await _create_asset(client, admin_user, product_id)

    await client.post(
        f"/assets/{asset_id}/assign",
        json={"employee_id": str(employee_user.id), "note": "assigned for onboarding"},
        headers=auth_headers(admin_user),
    )
    await client.post(
        f"/assets/{asset_id}/return",
        json={"note": "returned at offboarding"},
        headers=auth_headers(admin_user),
    )

    resp = await client.get(f"/assets/{asset_id}/history", headers=auth_headers(admin_user))
    assert resp.status_code == 200
    history = resp.json()
    assert len(history) == 2

    assigned_entry, returned_entry = history
    assert assigned_entry["action"] == "assigned"
    assert assigned_entry["employee_id"] == str(employee_user.id)
    assert assigned_entry["actor_id"] == str(admin_user.id)
    assert assigned_entry["note"] == "assigned for onboarding"

    assert returned_entry["action"] == "returned"
    assert returned_entry["employee_id"] == str(employee_user.id)
    assert returned_entry["actor_id"] == str(admin_user.id)
    assert returned_entry["note"] == "returned at offboarding"


async def test_employee_can_view_my_assets(client, admin_user, employee_user):
    product_id = await _create_product(client, admin_user)
    asset_id = await _create_asset(client, admin_user, product_id)

    await client.post(
        f"/assets/{asset_id}/assign",
        json={"employee_id": str(employee_user.id)},
        headers=auth_headers(admin_user),
    )

    resp = await client.get("/assets/my", headers=auth_headers(employee_user))
    assert resp.status_code == 200
    my_assets = resp.json()
    assert len(my_assets) == 1
    assert my_assets[0]["id"] == asset_id


async def test_employee_my_assets_excludes_others(client, admin_user, employee_user):
    product_id = await _create_product(client, admin_user)
    await _create_asset(client, admin_user, product_id, asset_tag="AST-999")

    resp = await client.get("/assets/my", headers=auth_headers(employee_user))
    assert resp.status_code == 200
    assert resp.json() == []


async def test_employee_cannot_create_asset(client, admin_user, employee_user):
    product_id = await _create_product(client, admin_user)
    resp = await client.post(
        "/assets",
        json={"asset_tag": "AST-002", "product_id": product_id},
        headers=auth_headers(employee_user),
    )
    assert resp.status_code == 403


async def test_employee_cannot_assign_asset(client, admin_user, employee_user):
    product_id = await _create_product(client, admin_user)
    asset_id = await _create_asset(client, admin_user, product_id)

    resp = await client.post(
        f"/assets/{asset_id}/assign",
        json={"employee_id": str(employee_user.id)},
        headers=auth_headers(employee_user),
    )
    assert resp.status_code == 403


async def test_employee_cannot_return_asset(client, admin_user, employee_user):
    product_id = await _create_product(client, admin_user)
    asset_id = await _create_asset(client, admin_user, product_id)
    await client.post(
        f"/assets/{asset_id}/assign",
        json={"employee_id": str(employee_user.id)},
        headers=auth_headers(admin_user),
    )

    resp = await client.post(
        f"/assets/{asset_id}/return",
        json={},
        headers=auth_headers(employee_user),
    )
    assert resp.status_code == 403


async def test_manager_can_create_and_assign(client, admin_user, manager_user, employee_user):
    # Products are admin-only now; manager still has full asset management.
    product_id = await _create_product(client, admin_user, name="Manager Laptop")
    asset_id = await _create_asset(client, manager_user, product_id, asset_tag="AST-MGR")

    resp = await client.post(
        f"/assets/{asset_id}/assign",
        json={"employee_id": str(employee_user.id)},
        headers=auth_headers(manager_user),
    )
    assert resp.status_code == 200


async def test_bulk_create_generates_sequential_tags(client, admin_user):
    product_id = await _create_product(client, admin_user)
    resp = await client.post(
        "/assets/bulk",
        json={"product_id": product_id, "tag_prefix": "BULK-", "start_number": 1, "count": 3, "pad_width": 3},
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 201
    body = resp.json()
    assert [a["asset_tag"] for a in body["created"]] == ["BULK-001", "BULK-002", "BULK-003"]
    assert body["skipped_tags"] == []


async def test_bulk_create_skips_existing_tags(client, admin_user):
    product_id = await _create_product(client, admin_user)
    await _create_asset(client, admin_user, product_id, asset_tag="BULK-002")

    resp = await client.post(
        "/assets/bulk",
        json={"product_id": product_id, "tag_prefix": "BULK-", "start_number": 1, "count": 3, "pad_width": 3},
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 201
    body = resp.json()
    assert [a["asset_tag"] for a in body["created"]] == ["BULK-001", "BULK-003"]
    assert body["skipped_tags"] == ["BULK-002"]


async def test_bulk_create_requires_valid_product(client, admin_user):
    resp = await client.post(
        "/assets/bulk",
        json={
            "product_id": "00000000-0000-0000-0000-000000000000",
            "tag_prefix": "BULK-",
            "start_number": 1,
            "count": 2,
        },
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 404


async def test_employee_cannot_bulk_create(client, admin_user, employee_user):
    product_id = await _create_product(client, admin_user)
    resp = await client.post(
        "/assets/bulk",
        json={"product_id": product_id, "tag_prefix": "BULK-", "start_number": 1, "count": 2},
        headers=auth_headers(employee_user),
    )
    assert resp.status_code == 403


async def test_employee_cannot_list_all_assets(client, admin_user, employee_user):
    await _create_product(client, admin_user)
    resp = await client.get("/assets", headers=auth_headers(employee_user))
    assert resp.status_code == 403


async def test_manager_can_list_all_assets(client, manager_user):
    resp = await client.get("/assets", headers=auth_headers(manager_user))
    assert resp.status_code == 200


async def test_employee_can_view_history_of_own_assigned_asset(client, admin_user, employee_user):
    product_id = await _create_product(client, admin_user)
    asset_id = await _create_asset(client, admin_user, product_id)
    await client.post(
        f"/assets/{asset_id}/assign",
        json={"employee_id": str(employee_user.id)},
        headers=auth_headers(admin_user),
    )

    resp = await client.get(f"/assets/{asset_id}/history", headers=auth_headers(employee_user))
    assert resp.status_code == 200


async def test_employee_cannot_view_history_of_unrelated_asset(client, admin_user, employee_user):
    product_id = await _create_product(client, admin_user)
    asset_id = await _create_asset(client, admin_user, product_id)
    # never assigned to this employee

    resp = await client.get(f"/assets/{asset_id}/history", headers=auth_headers(employee_user))
    assert resp.status_code == 403
