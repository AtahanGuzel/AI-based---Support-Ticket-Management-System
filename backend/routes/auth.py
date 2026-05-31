from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
import model
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os

router = APIRouter(prefix="/auth", tags=["Auth"])

SECRET_KEY = os.getenv("SECRET_KEY", "changeme-super-secret-key-please-set-in-env")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class LoginSchema(BaseModel):
    email: str
    password: str

class UserCreateSchema(BaseModel):
    full_name: str
    email: str
    password: str
    role: str = "customer"
    department_id: int | None = None

class TokenSchema(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    role: str
    full_name: str
    email: str
    department_id: int | None

# ── Helpers ───────────────────────────────────────────────────────────────────

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ── Shared Dependencies (imported by tickets.py and reports.py) ───────────────

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> model.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(model.User).filter(model.User.user_id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user


class RoleChecker:
    """Dependency that enforces role-based access. Usage: Depends(RoleChecker(['admin']))"""
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: model.User = Depends(get_current_user)) -> model.User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {self.allowed_roles}",
            )
        return current_user


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/register", summary="Yeni Kullanıcı Kaydı")
def register(payload: UserCreateSchema, db: Session = Depends(get_db)):
    existing = db.query(model.User).filter(model.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı.")

    new_user = model.User(
        full_name=payload.full_name,
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        role=payload.role,
        department_id=payload.department_id,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Kullanıcı başarıyla oluşturuldu.", "user_id": new_user.user_id}


@router.post("/login", response_model=TokenSchema, summary="Giriş Yap / JWT Al")
def login(payload: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(model.User).filter(model.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-posta veya şifre hatalı.",
        )

    token = create_access_token({"sub": str(user.user_id), "role": user.role})
    return {
    "access_token": token,
    "token_type": "bearer",
    "user_id": user.user_id,
    "role": user.role,
    "full_name": user.full_name,
    "email": user.email,
    "department_id": user.department_id,
}


@router.get("/me", summary="Mevcut Kullanıcı Bilgileri")
def get_me(current_user: model.User = Depends(get_current_user)):
    return {
        "user_id": current_user.user_id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "department_id": current_user.department_id,
    }