from fastapi.testclient import TestClient
from main import app
import sys
import types

# Mock the db module to avoid real database/network dependencies
db_mock = types.ModuleType("db")
_db_store = {}
_db_counter = 0

def init_db():
    global _db_store, _db_counter
    _db_store = {}
    _db_counter = 0

def add_record(table, data):
    global _db_counter
    _db_counter += 1
    record_id = str(_db_counter)
    data["id"] = record_id
    _db_store[record_id] = data
    return data

def list_records(table):
    return list(_db_store.values())

def update_record(record_id, update_data):
    if record_id not in _db_store:
        raise Exception("Not found")
    _db_store[record_id].update(update_data)
    return _db_store[record_id]

def delete_record(record_id):
    if record_id not in _db_store:
        raise Exception("Not found")
    del _db_store[record_id]

db_mock.init_db = init_db
db_mock.add_record = add_record
db_mock.list_records = list_records
db_mock.update_record = update_record
db_mock.delete_record = delete_record
db_mock.router = app.router

sys.modules["db"] = db_mock

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_create_expense():
    payload = {
        "description": "Coffee",
        "amount": 4.50,
        "category": "Food",
        "date": "2023-10-01T10:00:00"
    }
    response = client.post("/api/expenses", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["id"], str)
    assert data["description"] == "Coffee"
    assert data["amount"] == 4.50
    assert data["category"] == "Food"
    assert data["date"] == "2023-10-01T10:00:00"

def test_create_expense_without_date():
    payload = {
        "description": "Bus ticket",
        "amount": 2.50,
        "category": "Transport"
    }
    response = client.post("/api/expenses", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["id"], str)
    assert isinstance(data["date"], str)
    assert len(data["date"]) > 0

def test_create_expense_invalid_amount():
    payload = {
        "description": "Invalid expense",
        "amount": -10.0
    }
    response = client.post("/api/expenses", json=payload)
    assert response.status_code == 422

def test_list_expenses():
    client.post("/api/expenses", json={"description": "Item 1", "amount": 10.0, "category": "A"})
    client.post("/api/expenses", json={"description": "Item 2", "amount": 20.0, "category": "B"})
    response = client.get("/api/expenses")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    for item in data:
        assert isinstance(item["id"], str)
        assert isinstance(item["description"], str)
        assert isinstance(item["amount"], float)

def test_list_expenses_filter_category():
    client.post("/api/expenses", json={"description": "Filtered 1", "amount": 5.0, "category": "UniqueCat"})
    response = client.get("/api/expenses", params={"category": "UniqueCat"})
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    for item in data:
        assert item["category"] == "UniqueCat"

def test_get_expense():
    create_resp = client.post("/api/expenses", json={"description": "Get me", "amount": 15.0})
    expense_id = create_resp.json()["id"]
    response = client.get(f"/api/expenses/{expense_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == expense_id
    assert data["description"] == "Get me"
    assert data["amount"] == 15.0

def test_get_expense_not_found():
    response = client.get("/api/expenses/nonexistent_id")
    assert response.status_code == 404
    assert response.json()["detail"] == "Expense not found"

def test_update_expense():
    create_resp = client.post("/api/expenses", json={"description": "Old desc", "amount": 10.0, "category": "OldCat"})
    expense_id = create_resp.json()["id"]
    update_payload = {"description": "New desc", "amount": 20.0}
    response = client.put(f"/api/expenses/{expense_id}", json=update_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == expense_id
    assert data["description"] == "New desc"
    assert data["amount"] == 20.0

def test_update_expense_not_found():
    update_payload = {"description": "Doesn't matter"}
    response = client.put("/api/expenses/nonexistent_id", json=update_payload)
    assert response.status_code == 404
    assert response.json()["detail"] == "Expense not found"

def test_update_expense_no_fields():
    create_resp = client.post("/api/expenses", json={"description": "Test", "amount": 5.0})
    expense_id = create_resp.json()["id"]
    response = client.put(f"/api/expenses/{expense_id}", json={})
    assert response.status_code == 400
    assert response.json()["detail"] == "No fields to update"

def test_delete_expense():
    create_resp = client.post("/api/expenses", json={"description": "Delete me", "amount": 30.0})
    expense_id = create_resp.json()["id"]
    response = client.delete(f"/api/expenses/{expense_id}")
    assert response.status_code == 200
    assert response.json()["detail"] == "Expense deleted"
    get_resp = client.get(f"/api/expenses/{expense_id}")
    assert get_resp.status_code == 404

def test_delete_expense_not_found():
    response = client.delete("/api/expenses/nonexistent_id")
    assert response.status_code == 404
    assert response.json()["detail"] == "Expense not found"

def test_expenses_summary():
    client.post("/api/expenses", json={"description": "Sum1", "amount": 10.0, "category": "Food"})
    client.post("/api/expenses", json={"description": "Sum2", "amount": 20.0, "category": "Food"})
    client.post("/api/expenses", json={"description": "Sum3", "amount": 30.0, "category": "Transport"})
    response = client.get("/api/expenses/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_amount" in data
    assert "categories" in data