from tests.conftest import auth_headers


async def test_admin_can_list_users(client, admin_user, employee_user):
    resp = await client.get("/users", headers=auth_headers(admin_user))
    assert resp.status_code == 200
    ids = {u["id"] for u in resp.json()}
    assert str(admin_user.id) in ids
    assert str(employee_user.id) in ids


async def test_manager_cannot_list_users(client, manager_user):
    resp = await client.get("/users", headers=auth_headers(manager_user))
    assert resp.status_code == 403


async def test_employee_cannot_list_users(client, employee_user):
    resp = await client.get("/users", headers=auth_headers(employee_user))
    assert resp.status_code == 403


async def test_admin_can_update_user_role(client, admin_user, employee_user):
    resp = await client.put(
        f"/users/{employee_user.id}/role",
        json={"role": "manager"},
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 200
    assert resp.json()["role"] == "manager"


async def test_update_role_rejects_invalid_value(client, admin_user, employee_user):
    resp = await client.put(
        f"/users/{employee_user.id}/role",
        json={"role": "superuser"},
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 422


async def test_manager_cannot_update_user_role(client, manager_user, employee_user):
    resp = await client.put(
        f"/users/{employee_user.id}/role",
        json={"role": "admin"},
        headers=auth_headers(manager_user),
    )
    assert resp.status_code == 403


async def test_employee_cannot_update_user_role(client, employee_user, manager_user):
    resp = await client.put(
        f"/users/{manager_user.id}/role",
        json={"role": "employee"},
        headers=auth_headers(employee_user),
    )
    assert resp.status_code == 403


async def test_cannot_demote_last_admin(client, admin_user):
    # admin_user is the only admin in this test's isolated data
    resp = await client.put(
        f"/users/{admin_user.id}/role",
        json={"role": "employee"},
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 409


async def test_can_demote_admin_when_another_admin_exists(client, admin_user, second_admin_user):
    resp = await client.put(
        f"/users/{admin_user.id}/role",
        json={"role": "employee"},
        headers=auth_headers(second_admin_user),
    )
    assert resp.status_code == 200
    assert resp.json()["role"] == "employee"


async def test_update_nonexistent_user_returns_404(client, admin_user):
    resp = await client.put(
        "/users/00000000-0000-0000-0000-000000000000/role",
        json={"role": "manager"},
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 404
