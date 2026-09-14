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
        json={"role": "manager"},
        headers=auth_headers(manager_user),
    )
    assert resp.status_code == 403


async def test_cannot_promote_user_to_admin_via_role_endpoint(client, admin_user, employee_user):
    resp = await client.put(
        f"/users/{employee_user.id}/role",
        json={"role": "admin"},
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 422


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


async def test_manager_can_list_assignable_users(client, manager_user, employee_user):
    resp = await client.get("/users/assignable", headers=auth_headers(manager_user))
    assert resp.status_code == 200
    ids = {u["id"] for u in resp.json()}
    assert str(employee_user.id) in ids


async def test_employee_cannot_list_assignable_users(client, employee_user):
    resp = await client.get("/users/assignable", headers=auth_headers(employee_user))
    assert resp.status_code == 403


# --- POST /users (admin creates manager/employee) ---


async def test_admin_can_create_manager(client, admin_user):
    resp = await client.post(
        "/users",
        json={"name": "New Manager", "email": "newmgr@staunchsys.com", "password": "pass1234", "role": "manager"},
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["role"] == "manager"
    assert body["email"] == "newmgr@staunchsys.com"
    assert "password" not in body
    assert "password_hash" not in body


async def test_admin_can_create_employee(client, admin_user):
    resp = await client.post(
        "/users",
        json={"name": "New Emp", "email": "newemp@staunchsys.com", "password": "pass1234", "role": "employee"},
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 201
    assert resp.json()["role"] == "employee"


async def test_admin_cannot_create_admin_via_this_endpoint(client, admin_user):
    resp = await client.post(
        "/users",
        json={"name": "Sneaky Admin", "email": "sneaky@stockflow.com", "password": "pass1234", "role": "admin"},
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 422


async def test_create_user_rejects_non_company_email(client, admin_user):
    resp = await client.post(
        "/users",
        json={"name": "Outsider", "email": "outsider@gmail.com", "password": "pass1234", "role": "employee"},
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 422


async def test_manager_cannot_create_users(client, manager_user):
    resp = await client.post(
        "/users",
        json={"name": "X", "email": "x@stockflow.com", "password": "pass1234", "role": "employee"},
        headers=auth_headers(manager_user),
    )
    assert resp.status_code == 403


async def test_created_user_can_log_in_with_set_password(client, admin_user):
    resp = await client.post(
        "/users",
        json={"name": "Login Test", "email": "logintest@staunchsys.com", "password": "mypassword1", "role": "employee"},
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 201

    login_resp = await client.post(
        "/auth/login",
        data={"username": "logintest@staunchsys.com", "password": "mypassword1"},
    )
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()


# --- PUT /auth/change-password ---


async def test_user_can_change_own_password(client, employee_user):
    resp = await client.put(
        "/auth/change-password",
        json={"current_password": "password123", "new_password": "newpassword456"},
        headers=auth_headers(employee_user),
    )
    assert resp.status_code == 200

    login_resp = await client.post(
        "/auth/login",
        data={"username": employee_user.email, "password": "newpassword456"},
    )
    assert login_resp.status_code == 200


async def test_change_password_rejects_wrong_current_password(client, employee_user):
    resp = await client.put(
        "/auth/change-password",
        json={"current_password": "wrongpassword", "new_password": "newpassword456"},
        headers=auth_headers(employee_user),
    )
    assert resp.status_code == 400

    # original password must still work
    login_resp = await client.post(
        "/auth/login",
        data={"username": employee_user.email, "password": "password123"},
    )
    assert login_resp.status_code == 200


async def test_change_password_rejects_same_as_current(client, employee_user):
    resp = await client.put(
        "/auth/change-password",
        json={"current_password": "password123", "new_password": "password123"},
        headers=auth_headers(employee_user),
    )
    assert resp.status_code == 400
    assert "different" in resp.json()["detail"].lower()


# --- PUT /users/{id}/reset-password ---


async def test_admin_can_reset_any_users_password(client, admin_user, employee_user):
    resp = await client.put(
        f"/users/{employee_user.id}/reset-password",
        json={"new_password": "resetbyadmin1"},
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 200

    login_resp = await client.post(
        "/auth/login",
        data={"username": employee_user.email, "password": "resetbyadmin1"},
    )
    assert login_resp.status_code == 200


async def test_manager_cannot_reset_employee_password(client, manager_user, employee_user):
    resp = await client.put(
        f"/users/{employee_user.id}/reset-password",
        json={"new_password": "resetbymgr1"},
        headers=auth_headers(manager_user),
    )
    assert resp.status_code == 403


async def test_manager_cannot_reset_admin_password(client, manager_user, admin_user):
    resp = await client.put(
        f"/users/{admin_user.id}/reset-password",
        json={"new_password": "hijacked123"},
        headers=auth_headers(manager_user),
    )
    assert resp.status_code == 403


async def test_manager_cannot_reset_other_manager_password(client, manager_user):
    from tests.conftest import _make_user
    from app.models.user import UserRole

    other_manager = await _make_user(UserRole.manager)
    resp = await client.put(
        f"/users/{other_manager.id}/reset-password",
        json={"new_password": "hijacked123"},
        headers=auth_headers(manager_user),
    )
    assert resp.status_code == 403


async def test_employee_cannot_reset_any_password(client, employee_user, admin_user):
    resp = await client.put(
        f"/users/{admin_user.id}/reset-password",
        json={"new_password": "hijacked123"},
        headers=auth_headers(employee_user),
    )
    assert resp.status_code == 403
