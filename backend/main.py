from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import db

app = FastAPI(title="Expense Tracker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(db.router)


class ExpenseBase(BaseModel):
    description: str
    amount: float = Field(gt=0)
    category: Optional[str] = None
    date: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = Field(default=None, gt=0)
    category: Optional[str] = None
    date: Optional[str] = None


class ExpenseOut(ExpenseBase):
    id: str


class ExpenseSummary(BaseModel):
    total_amount: float
    categories: dict


@app.on_event("startup")
def startup():
    db.init_db()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/expenses", response_model=ExpenseOut)
def create_expense(expense: ExpenseCreate):
    data = expense.dict()
    if not data.get("date"):
        data["date"] = datetime.utcnow().isoformat()
    record = db.add_record("expenses", data)
    return record


@app.get("/api/expenses", response_model=List[ExpenseOut])
def list_expenses(category: Optional[str] = None):
    records = db.list_records("expenses")
    if category:
        records = [r for r in records if r.get("category") == category]
    return records


@app.get("/api/expenses/{expense_id}", response_model=ExpenseOut)
def get_expense(expense_id: str):
    records = db.list_records("expenses")
    for r in records:
        if r["id"] == expense_id:
            return r
    raise HTTPException(status_code=404, detail="Expense not found")


@app.put("/api/expenses/{expense_id}", response_model=ExpenseOut)
def update_expense(expense_id: str, expense: ExpenseUpdate):
    update_data = {k: v for k, v in expense.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    try:
        record = db.update_record(expense_id, update_data)
        return record
    except Exception:
        raise HTTPException(status_code=404, detail="Expense not found")


@app.delete("/api/expenses/{expense_id}")
def delete_expense(expense_id: str):
    try:
        db.delete_record(expense_id)
        return {"detail": "Expense deleted"}
    except Exception:
        raise HTTPException(status_code=404, detail="Expense not found")


@app.get("/api/expenses/summary", response_model=ExpenseSummary)
def expenses_summary():
    records = db.list_records("expenses")
    total = 0.0
    cats = {}
    for r in records:
        amt = r.get("amount", 0)
        total += amt
        c = r.get("category") or "Uncategorized"
        cats[c] = cats.get(c, 0) + amt
    return {"total_amount": total, "categories": cats}
