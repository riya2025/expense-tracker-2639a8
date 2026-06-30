import os
import random
import datetime
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import db

app = FastAPI(title="Expense Tracker", version="1.0.0")

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
    amount: float = Field(..., gt=0)
    category: str
    date: str


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[str] = None
    date: Optional[str] = None


class ExpenseOut(ExpenseBase):
    id: str


class UserCreate(BaseModel):
    email: str
    name: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str


class LoginRequest(BaseModel):
    email: str


class LoginVerify(BaseModel):
    email: str
    code: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class HealthResponse(BaseModel):
    status: str


@app.on_event("startup")
def startup():
    db.init_db()


@app.get("/health", response_model=HealthResponse)
def health_check():
    return {"status": "ok"}


@app.post("/api/expenses", response_model=ExpenseOut)
def create_expense(expense: ExpenseCreate):
    data = expense.dict()
    record = db.add_record("expenses", data)
    return record


@app.get("/api/expenses", response_model=List[ExpenseOut])
def list_expenses(
    category: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    records = db.list_records("expenses")
    if category:
        records = [r for r in records if r.get("category") == category]
    if start_date:
        records = [r for r in records if r.get("date", "") >= start_date]
    if end_date:
        records = [r for r in records if r.get("date", "") <= end_date]
    return records


@app.put("/api/expenses/{expense_id}", response_model=ExpenseOut)
def update_expense(expense_id: str, expense: ExpenseUpdate):
    update_data = {k: v for k, v in expense.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    record = db.update_record(expense_id, update_data)
    if not record:
        raise HTTPException(status_code=404, detail="Expense not found")
    return record


@app.delete("/api/expenses/{expense_id}")
def delete_expense(expense_id: str):
    record = db.delete_record(expense_id)
    if not record:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"detail": "Expense deleted"}


@app.post("/api/users", response_model=UserOut)
def create_user(user: UserCreate):
    data = user.dict()
    record = db.add_record("users", data)
    return record


@app.get("/api/users", response_model=List[UserOut])
def list_users():
    return db.list_records("users")


@app.post("/api/auth/login")
def login(req: LoginRequest):
    code = f"{random.randint(0, 999999):06d}"
    db.add_record(
        "auth_codes",
        {
            "email": req.email,
            "code": code,
            "expires_at": (
                datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
            ).isoformat(),
        },
    )
    # Production would email the code instead of returning it
    return {"message": "Code generated", "code": code}


@app.post("/api/auth/verify", response_model=TokenResponse)
def verify_code(req: LoginVerify):
    codes = db.list_records("auth_codes")
    valid = [
        c for c in codes if c.get("email") == req.email and c.get("code") == req.code
    ]
    if not valid:
        raise HTTPException(status_code=401, detail="Invalid code")
    token = f"token-{random.randint(0, 999999):06d}"
    return {"access_token": token, "token_type": "bearer"}
