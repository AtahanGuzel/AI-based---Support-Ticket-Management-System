from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
# Rotaları içe aktarıyoruz
from routes import tickets, reports, auth

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Destek Bilet Sistemi API",
    description="Database ve Data Yönetimi odaklı profesyonel bilet yönetim sistemi.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)

app.include_router(tickets.router, prefix="/tickets", tags=["Tickets"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])

@app.get("/", summary="Sistem Sağlık Kontrolü")
def root():
    return {
        "status": "online",
        "message": "Destek Bilet Sistemi API başarıyla çalışıyor.",
        "documentation": "/docs"
    }