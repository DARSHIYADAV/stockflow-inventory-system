from tests.conftest import auth_headers


async def _login(client, email, password, path="/auth/login"):
    return await client.post(path, data={"username": email, "password": password})


# --- /auth/login/admin ---


async def test_admin_can_login_via_admin_endpoint(client, admin_user):
    resp = await _login(client, admin_user.email, "password123", "/auth/login/admin")
    assert resp.status_code == 200
    assert "access_token" in resp.json()


async def test_manager_cannot_login_via_admin_endpoint(client, manager_user):
    resp = await _login(client, manager_user.email, "password123", "/auth/login/admin")
    assert resp.status_code == 401


async def test_employee_cannot_login_via_admin_endpoint(client, employee_user):
    resp = await _login(client, employee_user.email, "password123", "/auth/login/admin")
    assert resp.status_code == 401


# --- /auth/login/manager ---


async def test_manager_can_login_via_manager_endpoint(client, manager_user):
    resp = await _login(client, manager_user.email, "password123", "/auth/login/manager")
    assert resp.status_code == 200
    assert "access_token" in resp.json()


async def test_admin_cannot_login_via_manager_endpoint(client, admin_user):
    resp = await _login(client, admin_user.email, "password123", "/auth/login/manager")
    assert resp.status_code == 401


async def test_employee_cannot_login_via_manager_endpoint(client, employee_user):
    resp = await _login(client, employee_user.email, "password123", "/auth/login/manager")
    assert resp.status_code == 401


# --- /auth/login/employee ---


async def test_employee_can_login_via_employee_endpoint(client, employee_user):
    resp = await _login(client, employee_user.email, "password123", "/auth/login/employee")
    assert resp.status_code == 200
    assert "access_token" in resp.json()


async def test_admin_cannot_login_via_employee_endpoint(client, admin_user):
    resp = await _login(client, admin_user.email, "password123", "/auth/login/employee")
    assert resp.status_code == 401


async def test_manager_cannot_login_via_employee_endpoint(client, manager_user):
    resp = await _login(client, manager_user.email, "password123", "/auth/login/employee")
    assert resp.status_code == 401


# --- wrong password still rejected on all three ---


async def test_admin_endpoint_rejects_wrong_password(client, admin_user):
    resp = await _login(client, admin_user.email, "wrongpassword", "/auth/login/admin")
    assert resp.status_code == 401


async def test_manager_endpoint_rejects_wrong_password(client, manager_user):
    resp = await _login(client, manager_user.email, "wrongpassword", "/auth/login/manager")
    assert resp.status_code == 401


async def test_employee_endpoint_rejects_wrong_password(client, employee_user):
    resp = await _login(client, employee_user.email, "wrongpassword", "/auth/login/employee")
    assert resp.status_code == 401


# --- error messages are identical for wrong-password vs wrong-role (no leak) ---


async def test_wrong_role_and_wrong_password_give_identical_error(client, employee_user):
    wrong_role_resp = await _login(client, employee_user.email, "password123", "/auth/login/admin")
    wrong_password_resp = await _login(client, employee_user.email, "wrongpassword", "/auth/login/admin")

    assert wrong_role_resp.status_code == wrong_password_resp.status_code == 401
    assert wrong_role_resp.json()["detail"] == wrong_password_resp.json()["detail"]


# --- unaffected: original shared /auth/login and /auth/register ---


async def test_shared_login_still_works_for_any_role(client, admin_user, manager_user, employee_user):
    for user in (admin_user, manager_user, employee_user):
        resp = await _login(client, user.email, "password123")
        assert resp.status_code == 200


# --- only one admin account may ever exist ---


async def test_register_rejects_second_admin(client, admin_user):
    from tests.conftest import auth_headers

    resp = await client.post(
        "/auth/register",
        json={
            "name": "Second Admin",
            "email": "second-admin@staunchsys.com",
            "password": "pass1234",
            "role": "admin",
        },
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 400
    assert "one admin" in resp.json()["detail"].lower()


async def test_register_still_allows_manager_and_employee(client, admin_user):
    from tests.conftest import auth_headers

    resp = await client.post(
        "/auth/register",
        json={
            "name": "New Manager",
            "email": "new-manager@staunchsys.com",
            "password": "pass1234",
            "role": "manager",
        },
        headers=auth_headers(admin_user),
    )
    assert resp.status_code == 201
    assert resp.json()["role"] == "manager"
