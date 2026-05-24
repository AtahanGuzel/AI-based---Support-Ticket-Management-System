from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
import model

router = APIRouter()

# ==========================================
# PYDANTIC ŞEMALARI (Gelen Veri Doğrulaması)
# ==========================================
class SmartTicketSubmitSchema(BaseModel):
    user_id: int
    issue_description: str  # Kullanıcının chat ekranına yazdığı doğal dil metni

class MessageCreateSchema(BaseModel):
    user_id: int
    message_body: str

# ==========================================
# API UÇ NOKTALARI (ORM Entegrasyonu ile)
# ==========================================
@router.post("/submit", summary="Yapay Zeka Destekli Bilet Gönderimi")
def submit_smart_ticket(
    payload: SmartTicketSubmitSchema, 
    request: Request,  # İstemci(Client) verilerini sessizce yakalamak için
    db: Session = Depends(get_db)
):
    try:
        # ==========================================
        # 1. AUTO-CONTEXT CAPTURE (Bağlam Yakalama)
        # ==========================================
        client_ip = request.client.host
        user_agent = request.headers.get('user-agent', 'Bilinmeyen OS/Tarayıcı')
        
        # ==========================================
        # 2. YAPAY ZEKA ANALİZ KATMANI (Hazırlık)
        # ==========================================
        # NOT: İleride LLM (Örn: LangChain/Groq) entegrasyonu buraya gelecek.
        # Şimdilik AI'ın sorunu analiz edip aşağıdaki değerleri döndürdüğünü varsayıyoruz:
        ai_department_id = 2  # Örn: IT Departmanı
        ai_urgency_score = 4  # Örn: Yüksek Öncelik (1-10 arası)
        
        # ==========================================
        # 3. VERİTABANI İŞLEMLERİ (Transaction)
        # ==========================================
        
        # A. Ana Bileti Oluştur
        yeni_bilet = model.Ticket(
            user_id=payload.user_id,
            description=payload.issue_description,
            status='open',
            urgency_score=ai_urgency_score, # AI belirledi
            department_id=ai_department_id  # AI belirledi
        )
        db.add(yeni_bilet)
        db.flush() # ID'yi üret (commit yapmadan)

        # B. Yakalanan Bağlamı System_Log Tablosuna Yaz
        yeni_log = model.SystemLog(
            ticket_id=yeni_bilet.ticket_id,
            ipAddress=client_ip,
            osVersion=user_agent,
            errorTrace="Chatbot üzerinden otomatik oluşturuldu."
        )
        db.add(yeni_log)

        # C. İlk Mesajı (Sohbet Geçmişi) Kaydet
        yeni_mesaj = model.TicketMessage(
            ticket_id=yeni_bilet.ticket_id,
            user_id=payload.user_id,
            message_body=payload.issue_description
        )
        db.add(yeni_mesaj)

        # Her şey başarılıysa tüm verileri kalıcı yap
        db.commit()
        db.refresh(yeni_bilet)

        return {
            "status": "success",
            "message": "Talebiniz yapay zeka tarafından analiz edildi ve ilgili birime yönlendirildi.",
            "ticket_id": yeni_bilet.ticket_id,
            "captured_context": {
                "ip_address": client_ip,
                "os_version": user_agent
            }
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Bilet oluşturulurken kritik hata: {str(e)}")


@router.post("/{ticket_id}/messages", summary="Bilete Mesaj Ekle")
def add_message(ticket_id: int, message: MessageCreateSchema, db: Session = Depends(get_db)):
    try:
        # Doğrudan ORM modeli üzerinden yeni mesaj oluşturma
        yeni_mesaj = model.TicketMessage(
            ticket_id=ticket_id,
            user_id=message.user_id,
            message_body=message.message_body
        )
        db.add(yeni_mesaj)
        db.commit()
        
        # Refresh: Nesneyi veritabanındaki son haliyle günceller
        db.refresh(yeni_mesaj)

        return {
            "message": "Mesaj başarıyla eklendi",
            "message_id": yeni_mesaj.message_id 
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Mesaj eklenirken hata oluştu: {str(e)}")