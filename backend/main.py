from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Yazdığımız tickets rotasını içeri aktarıyoruz
from routes import tickets

# Uygulamayı FastAPI olarak başlatıyoruz (Sorunu çözen kısım)
app = FastAPI(title="Destek Bilet (Ticket) Sistemi API")

# Güvenlik Duvarı (CORS) Ayarları
# Frontend'inizin (HTML/JS) bu API'ye veri gönderebilmesi için şarttır
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Geliştirme ortamında her yerden gelen isteğe izin veriyoruz
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotaları uygulamaya bağlıyoruz
app.include_router(tickets.router, prefix="/tickets", tags=["Tickets"])

@app.get("/")
def root():
    return {"message": "Bilet Sistemi Backend'i Çalışıyor!"}