from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert isinstance(data["status"], str)


def test_create_expense():
    payload = {
        "description": "Coffee",
        "amount": 4.50,
        "category": "Food",
        "date": "2023-10-01"
    }
    response = client.post("/api/expenses", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert isinstance(data["id"], str)
    assert data["description"] == "Coffee"
    assert data["amount"] == 4.50
    assert data["category"] == "Food"
    assert data["date"] == "2023-10-01"


def test_list_expenses():
    response = client.get("/api/expenses")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if data:
        item = data[0]
        assert "id" in item
        assert "description" in item
        assert "amount" in item
        assert "category" in item
        assert "date" in item


def test_list_expenses_with_filters():
    response = client.get("/api/expenses", params={"category": "Food"})
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    for item in data:
        assert item.get("category") == "Food"


def test_update_expense():
    create_payload = {
        "description": "Lunch",
        "amount": 15.0,
        "category": "Food",
        "date": "2023-10-02"
    }
    create_resp = client.post("/api/expenses", json=create_payload)
    assert create_resp.status_code == 200
    expense_id = create_resp.json()["id"]

    update_payload = {"description": "Updated Lunch", "amount": 20.0}
    update_resp = client.put(f"/api/expenses/{expense_id}", json=update_payload)
    assert update_resp.status_code == 200
    data = update_resp.json()
    assert data["id"] == expense_id
    assert data["description"] == "Updated Lunch"
    assert data["amount"] == 20.0


def test_update_expense_not_found():
    update_payload = {"description": "Nonexistent"}
    response = client.put("/api/expenses/nonexistent-id", json=update_payload)
    assert response.status_code == 404


def test_update_expense_no_fields():
    create_payload = {
        "description": "Dinner",
        "amount": 30.0,
        "category": "Food",
        "date": "2023-10-03"
    }
    create_resp = client.post("/api/expenses", json=create_payload)
    assert create_resp.status_code == 200
    expense_id = create_resp.json()["id"]

    update_resp = client.put(f"/api/expenses/{expense_id}", json={})
    assert update_resp.status_code == 400


def test_delete_expense():
    create_payload = {
        "description": "Bus Ticket",
        "amount": 2.50,
        "category": "Transport",
        "date": "2023-10-04"
    }
    create_resp = client.post("/api/expenses", json=create_payload)
    assert create_resp.status_code == 200
    expense_id = create_resp.json()["id"]

    delete_resp = client.delete(f"/api/expenses/{expense_id}")
    assert delete_resp.status_code == 200
    assert delete_resp.json()["detail"] == "Expense deleted"


def test_delete_expense_not_found():
    response = client.delete("/api/expenses/nonexistent-id")
    assert response.status_code == 404


def test_create_user():
    payload = {
        "email": "test@example.com",
        "name": "Test User"
    }
    response = client.post("/api/users", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert isinstance(data["id"], str)
    assert data["email"] == "test@example.com"
    assert data["name"] == "Test User"


def test_list_users():
    response = client.get("/api/users")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if data:
        item = data[0]
        assert "id" in item
        assert "email" in item
        assert "name" in item


def test_login():
    payload = {"email": "user@example.com"}
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "code" in data
    assert isinstance(data["code"], str)
    assert len(data["code"]) == 6


def test_verify_code():
    login_payload = {"email": "verify@example.com"}
    login_resp = client.post("/api/auth/login", json=login_payload)
    assert login_resp.status_code == 200
    code = login_resp.json()["code"]

    verify_payload = {"email": "verify@example.com", "code": code}
    verify_resp = client.post("/api/auth/verify", json=verify_payload)
    assert verify_resp.status_code == 200
    data = verify_resp.json()
    assert "access_token" in data
    assert isinstance(data["access_token"], str)
    assert data["token_type"] == "bearer"


def test_verify_code_invalid():
    payload = {"email": "invalid@example.com", "code": "000000"}
    response = client.post("/api/auth/verify", json=payload)
    assert response.status_code == 401