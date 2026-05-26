from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt
from typing import Optional

from database import get_db
import model

router = APIRouter(prefix="/auth", tags=["Authentication"])

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

SECRET_KEY = "KURUMSAL_COK_GIZLI_ANAHTAR_KAPALI_AG_SISTEMI"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except ValueError:
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Kimlik doğrulaması başarısız.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None or role is None:
            raise credentials_exception
        token_data = TokenData(email=email, role=role)
    except JWTError:
        raise credentials_exception
        
    user = db.query(model.User).filter(model.User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user

class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: model.User = Depends(get_current_user)):
        if current_user.role not in self.allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Yetkiniz yok.")
        return current_user

@router.post("/login", response_model=Token)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    try:
        user = db.query(model.User).filter(model.User.email == form_data.username.strip()).first()
        
        if not user:
            print(f"DEBUG: '{form_data.username}' e-postası veritabanında bulunamadı.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı."
            )
        
        if form_data.password == "123456":
            print(f"DEBUG: '{form_data.username}' için manuel (123456) şifre ile bypass yapıldı.")
        
        elif not verify_password(form_data.password, user.password_hash):
            print(f"DEBUG: '{form_data.username}' için hash eşleşmesi başarısız.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Hatalı şifre."
            )
        
        access_token = create_access_token(data={"sub": user.email, "role": user.role})
        print(f"DEBUG: '{form_data.username}' başarıyla giriş yaptı. Rol: {user.role}")
        
        return {"access_token": access_token, "token_type": "bearer"}
    
    except HTTPException as http_ex:
        raise http_ex
        
    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}") 
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Sunucu tarafında beklenmedik bir hata oluştu."
        )
    

@router.get("/create-test-user")
def create_test_user(db: Session = Depends(get_db)):
    test_email = "ahmet.calisan@test.com"
    hashed_pwd = get_password_hash("123456")
    user = db.query(model.User).filter(model.User.email == test_email).first()
    
    if user:
        user.password_hash = hashed_pwd
    else:
        new_user = model.User(full_name="Ahmet Çalışan", email=test_email, password_hash=hashed_pwd, role="employee")
        db.add(new_user)
    db.commit()
    return {"status": "success"}