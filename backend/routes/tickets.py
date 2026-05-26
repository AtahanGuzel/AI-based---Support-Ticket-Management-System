from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
from database import get_db
import model

# Yetkilendirme  içe aktarıyoruz
from routes.auth import get_current_user, RoleChecker

router = APIRouter()


allow_employee = RoleChecker(["employee", "admin"])
allow_agent = RoleChecker(["agent", "admin"])
allow_admin = RoleChecker(["admin"])


class TicketSubmitSchema(BaseModel):
    department_id: int 
    description: str

class MessageCreateSchema(BaseModel):
    message_body: str

class StatusUpdateSchema(BaseModel):
    status: str

class MessageResponseSchema(BaseModel):
    message_id: int
    sender_id: int  
    message_body: str
    created_at: datetime
    class Config:
        from_attributes = True

class TicketResponseSchema(BaseModel):
    ticket_id: int
    user_id: int
    department_id: int
    description: str
    status: str
    priority: int  
    created_at: datetime
    resolved_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class TicketDetailResponseSchema(TicketResponseSchema):
    conversation_history: List[MessageResponseSchema] = []

@router.post("/submit", summary="Bilet Gönderimi (Sadece Çalışanlar)")
def submit_ticket(
    payload: TicketSubmitSchema, 
    request: Request,
    db: Session = Depends(get_db),
    current_user: model.User = Depends(allow_employee) # KİLİT: Sadece Employee/Admin
):
    try:
        client_ip = request.client.host
        user_agent = request.headers.get('user-agent', 'Bilinmeyen OS/Tarayıcı')
        
        yeni_bilet = model.Ticket(
            user_id=current_user.user_id, # Kimlik Token'dan alınıyor
            department_id=payload.department_id,
            description=payload.description,
            status='open',
            priority=5 
        )
        db.add(yeni_bilet)
        db.flush()

        yeni_log = model.LogTable(
            changed_by=current_user.user_id,
            table_name='tickets',
            record_id=yeni_bilet.ticket_id,
            action='INSERT',
            new_data={
                "ip_address": client_ip, 
                "os_version": user_agent, 
                "source": "Web Form"
            }
        )
        db.add(yeni_log)

        # C. İlk Mesajı Kaydet
        yeni_mesaj = model.TicketMessage(
            ticket_id=yeni_bilet.ticket_id,
            sender_id=current_user.user_id, 
            message_body=payload.description
        )
        db.add(yeni_mesaj)

        db.commit()
        db.refresh(yeni_bilet)

        return {
            "status": "success",
            "message": "Bilet başarıyla oluşturuldu.",
            "ticket_id": yeni_bilet.ticket_id
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Bilet oluşturulurken hata: {str(e)}")

@router.get("/my-tickets", summary="Kendi Biletlerim (Sadece Çalışanlar)")
def get_my_tickets(
    db: Session = Depends(get_db),
    current_user: model.User = Depends(allow_employee) # KİLİT
):
    try:
        biletler = (
            db.query(model.Ticket)
            .filter(model.Ticket.user_id == current_user.user_id) # Veri İzolasyonu
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hata: {str(e)}")


@router.get("/", summary="Öncelik Sırasına Göre Açık Biletler (Sadece Destek Personeli)")
def get_all_tickets(
    db: Session = Depends(get_db),
    current_user: model.User = Depends(allow_agent)
):
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
        raise HTTPException(status_code=500, detail=f"Hata: {str(e)}")

@router.patch("/{ticket_id}/status", summary="Bilet Durumu Güncelle (Sadece Destek Personeli)")
def update_ticket_status(
    ticket_id: int, 
    payload: StatusUpdateSchema, 
    db: Session = Depends(get_db),
    current_user: model.User = Depends(allow_agent)
):
    bilet = db.query(model.Ticket).filter(model.Ticket.ticket_id == ticket_id).first()
    if not bilet:
        raise HTTPException(status_code=404, detail="Bilet bulunamadı")

    eski_durum = bilet.status
    bilet.status = payload.status
    if payload.status == "resolved":
        bilet.resolved_at = datetime.now(timezone.utc)

    try:
        yeni_log = model.LogTable(
            changed_by=current_user.user_id,
            table_name='tickets',
            record_id=bilet.ticket_id,
            action='UPDATE',
            old_data={"status": eski_durum},
            new_data={"status": payload.status}
        )
        db.add(yeni_log)
        db.commit()
        
        return {
            "message": f"Bilet durumu '{payload.status}' olarak güncellendi",
            "ticket_id": bilet.ticket_id,
            "status": bilet.status
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Durum güncellenirken hata: {str(e)}")


@router.get("/{ticket_id}", summary="Bilet Detayı ve Sohbet Geçmişi")
def get_ticket_detail(
    ticket_id: int, 
    db: Session = Depends(get_db),
    current_user: model.User = Depends(get_current_user) # Sisteme giriş yapmış herkes
):
    bilet = db.query(model.Ticket).filter(model.Ticket.ticket_id == ticket_id).first()
    if not bilet:
        raise HTTPException(status_code=404, detail="Bilet bulunamadı")
        
    if current_user.role == "employee" and bilet.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Sadece kendi biletlerinizi görüntüleyebilirsiniz.")

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

@router.post("/{ticket_id}/messages", summary="Bilete Mesaj Ekle")
def add_message(
    ticket_id: int, 
    message: MessageCreateSchema, 
    db: Session = Depends(get_db),
    current_user: model.User = Depends(get_current_user)
):
    try:
        yeni_mesaj = model.TicketMessage(
            ticket_id=ticket_id,
            sender_id=current_user.user_id,
            message_body=message.message_body
        )
        db.add(yeni_mesaj)
        db.commit()

        return {
            "message": "Mesaj eklendi",
            "message_id": yeni_mesaj.message_id 
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Mesaj eklenirken hata: {str(e)}")