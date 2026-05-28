import pytest
import pytest_asyncio
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@pawguide.ai",
            "password": "securepass123",
            "full_name": "Test User",
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == "test@pawguide.ai"
    assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {
        "email": "dup@pawguide.ai",
        "password": "securepass123",
        "full_name": "Dup User",
    }
    await client.post("/api/v1/auth/register", json=payload)
    res = await client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 409


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "login@test.com", "password": "pass12345", "full_name": "Login User"},
    )
    res = await client.post(
        "/api/v1/auth/login",
        data={"username": "login@test.com", "password": "pass12345"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "wrong@test.com", "password": "correct123", "full_name": "W User"},
    )
    res = await client.post(
        "/api/v1/auth/login",
        data={"username": "wrong@test.com", "password": "wrongpass"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_create_and_get_pet(client: AsyncClient):
    # Register + login
    reg = await client.post(
        "/api/v1/auth/register",
        json={"email": "petowner@test.com", "password": "pass12345", "full_name": "Pet Owner"},
    )
    user_id = reg.json()["id"]

    # Create pet
    res = await client.post(
        "/api/v1/pets/",
        params={"user_id": user_id},
        json={
            "name": "Buddy",
            "species": "dog",
            "sex": "male",
            "weight_kg": 12.5,
            "activity_level": "moderate",
            "is_neutered": False,
        },
    )
    assert res.status_code == 201
    pet = res.json()
    assert pet["name"] == "Buddy"
    assert pet["weight_kg"] == 12.5

    # Get pet
    get_res = await client.get(f"/api/v1/pets/{pet['id']}", params={"user_id": user_id})
    assert get_res.status_code == 200


@pytest.mark.asyncio
async def test_weight_log_crud(client: AsyncClient):
    reg = await client.post(
        "/api/v1/auth/register",
        json={"email": "wlog@test.com", "password": "pass12345", "full_name": "WL User"},
    )
    user_id = reg.json()["id"]

    pet_res = await client.post(
        "/api/v1/pets/",
        params={"user_id": user_id},
        json={"name": "Max", "species": "cat", "sex": "female", "weight_kg": 4.0, "activity_level": "low", "is_neutered": True},
    )
    pet_id = pet_res.json()["id"]

    # Log weights
    for w in [4.0, 4.1, 4.05]:
        r = await client.post(
            f"/api/v1/pets/{pet_id}/weight-logs",
            params={"user_id": user_id},
            json={"weight_kg": w, "calorie_intake": 220},
        )
        assert r.status_code == 201

    logs_res = await client.get(f"/api/v1/pets/{pet_id}/weight-logs", params={"user_id": user_id})
    assert logs_res.status_code == 200
    assert len(logs_res.json()) == 3


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    res = await client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"
