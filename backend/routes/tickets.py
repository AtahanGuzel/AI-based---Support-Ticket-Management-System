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

# ==========================================
# YENİ ENDPOINT'LER - TICKET SINIFI GÖREVLERİ
# ==========================================

# -------------------------------------------
# 1. Destek Personeli - Öncelik Sırası (Priority Queue)
# GET /tickets
# Kapalı olmayan biletleri aciliyet sırasına göre listeler
# -------------------------------------------
@router.get("/", summary="Öncelik Sırasına Göre Tüm Açık Biletler")
def get_all_tickets(db: Session = Depends(get_db)):
    try:
        biletler = (
            db.query(model.Ticket)
            .filter(model.Ticket.status != "closed")
            .order_by(model.Ticket.priority.asc(), model.Ticket.created_at.asc())
            .all()
        )

        return [
            {
                "ticket_id": b.ticket_id,
                "user_id": b.user_id,
                "department_id": b.department_id,
                "description": b.description,
                "status": b.status,
                "priority": b.priority,
                "created_at": b.created_at,
            }
            for b in biletler
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Biletler listelenirken hata: {str(e)}")


# -------------------------------------------
# 2. Bilet Detayı + Sohbet Geçmişi
# GET /tickets/{ticket_id}
# Biletin tüm bilgilerini ve mesaj geçmişini döndürür
# -------------------------------------------
@router.get("/{ticket_id}", summary="Bilet Detayı ve Sohbet Geçmişi")
def get_ticket_detail(ticket_id: int, db: Session = Depends(get_db)):
    bilet = db.query(model.Ticket).filter(model.Ticket.ticket_id == ticket_id).first()

    if not bilet:
        raise HTTPException(status_code=404, detail="Bilet bulunamadı")

    mesajlar = (
        db.query(model.TicketMessage)
        .filter(model.TicketMessage.ticket_id == ticket_id)
        .order_by(model.TicketMessage.created_at.asc())
        .all()
    )

    return {
        "ticket_id": bilet.ticket_id,
        "user_id": bilet.user_id,
        "department_id": bilet.department_id,
        "description": bilet.description,
        "status": bilet.status,
        "priority": bilet.priority,
        "created_at": bilet.created_at,
        "resolved_at": bilet.resolved_at,
        "conversation_history": [
            {
                "message_id": m.message_id,
                "sender_id": m.sender_id,
                "message_body": m.message_body,
                "created_at": m.created_at,
            }
            for m in mesajlar
        ],
    }


# -------------------------------------------
# 3. Kullanıcının Kendi Biletleri
# GET /tickets/my-tickets?user_id=X
# Sadece o kullanıcıya ait biletleri listeler
# -------------------------------------------
@router.get("/my-tickets", summary="Kullanıcının Kendi Biletleri")
def get_my_tickets(user_id: int, db: Session = Depends(get_db)):
    try:
        kullanici = db.query(model.User).filter(model.User.user_id == user_id).first()
        if not kullanici:
            raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

        biletler = (
            db.query(model.Ticket)
            .filter(model.Ticket.user_id == user_id)
            .order_by(model.Ticket.created_at.desc())
            .all()
        )

        return [
            {
                "ticket_id": b.ticket_id,
                "description": b.description,
                "status": b.status,
                "priority": b.priority,
                "created_at": b.created_at,
                "resolved_at": b.resolved_at,
            }
            for b in biletler
        ]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Biletler getirilirken hata: {str(e)}")


# -------------------------------------------
# 4. Durum Güncelleme + SLA Başlatma
# PATCH /tickets/{ticket_id}/status
# Bileti "resolved" yapar ve resolved_at zaman damgası basar
# -------------------------------------------
from datetime import datetime, timezone

class StatusUpdateSchema(BaseModel):
    status: str  # örn: "resolved", "in_progress", "closed"

@router.patch("/{ticket_id}/status", summary="Bilet Durumu Güncelle ve SLA Kaydet")
def update_ticket_status(ticket_id: int, payload: StatusUpdateSchema, db: Session = Depends(get_db)):
    bilet = db.query(model.Ticket).filter(model.Ticket.ticket_id == ticket_id).first()

    if not bilet:
        raise HTTPException(status_code=404, detail="Bilet bulunamadı")

    bilet.status = payload.status

    # Eğer resolved yapılıyorsa SLA için zaman damgası bas
    if payload.status == "resolved":
        bilet.resolved_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(bilet)
        return {
            "message": f"Bilet durumu '{payload.status}' olarak güncellendi",
            "ticket_id": bilet.ticket_id,
            "status": bilet.status,
            "resolved_at": bilet.resolved_at,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Durum güncellenirken hata: {str(e)}")
