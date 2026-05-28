from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime
from database import get_db
import model
from pydantic import BaseModel
from routes.auth import RoleChecker 

router = APIRouter(prefix="/reports", tags=["Reports"])

# Admin yetkisi aynen kalıyor
admin_only = RoleChecker(allowed_roles=["admin"])

class ReportSummarySchema(BaseModel):
    total_tickets: int
    resolved_tickets: int
    open_tickets: int
    avg_resolution_time_hours: float
    monthly_resolution_rate: float

class DepartmentReportSchema(BaseModel):
    department_name: str
    total_assigned: int
    resolved_count: int
    unresolved_count: int
    monthly_success_rate: float

@router.get("/summary", response_model=ReportSummarySchema, dependencies=[Depends(admin_only)], summary="Sistem Genel Durum Raporu")
def get_report_summary(db: Session = Depends(get_db)):
    current_month = datetime.now().month
    current_year = datetime.now().year

    # Bu blok mevcut haliyle yeterince optimize, doğrudan kullanılıyor
    total = db.query(func.count(model.Ticket.ticket_id)).scalar() or 0
    resolved = db.query(func.count(model.Ticket.ticket_id)).filter(model.Ticket.status == 'resolved').scalar() or 0
    open_tickets = db.query(func.count(model.Ticket.ticket_id)).filter(model.Ticket.status == 'open').scalar() or 0
    
    avg_time = db.query(func.avg(
        func.extract('epoch', model.Ticket.resolved_at - model.Ticket.created_at) / 3600
    )).filter(model.Ticket.status == 'resolved', model.Ticket.resolved_at.isnot(None)).scalar() or 0.0

    monthly_total = db.query(func.count(model.Ticket.ticket_id)).filter(
        extract('month', model.Ticket.created_at) == current_month,
        extract('year', model.Ticket.created_at) == current_year
    ).scalar() or 0
    
    monthly_resolved = db.query(func.count(model.Ticket.ticket_id)).filter(
        extract('month', model.Ticket.created_at) == current_month,
        extract('year', model.Ticket.created_at) == current_year,
        model.Ticket.status == 'resolved'
    ).scalar() or 0
    
    monthly_rate = (monthly_resolved / monthly_total * 100) if monthly_total > 0 else 0.0

    return {
        "total_tickets": total,
        "resolved_tickets": resolved,
        "open_tickets": open_tickets,
        "avg_resolution_time_hours": round(float(avg_time), 2),
        "monthly_resolution_rate": round(float(monthly_rate), 2)
    }

@router.get("/by-department", response_model=list[DepartmentReportSchema], dependencies=[Depends(admin_only)], summary="Departman Bazlı Performans Raporu")
def get_department_performance(db: Session = Depends(get_db)):
    current_month = datetime.now().month
    current_year = datetime.now().year

    # VERİ YÖNETİMİ OPTİMİZASYONU: Döngü içindeki N+1 sorgular kaldırıldı. 
    # Bütün istatistikler (genel ve aylık) veritabanı motoru seviyesinde tek sorguda hesaplanıyor.
    results = db.query(
        model.Department.department_name,
        func.count(model.Ticket.ticket_id).label("total"),
        func.count(model.Ticket.ticket_id).filter(model.Ticket.status == 'resolved').label("resolved"),
        func.count(model.Ticket.ticket_id).filter(model.Ticket.status != 'resolved').label("unresolved"),
        # Aylık verileri aynı sorgu içinde filtreliyoruz
        func.count(model.Ticket.ticket_id).filter(
            extract('month', model.Ticket.created_at) == current_month,
            extract('year', model.Ticket.created_at) == current_year
        ).label("monthly_total"),
        func.count(model.Ticket.ticket_id).filter(
            model.Ticket.status == 'resolved',
            extract('month', model.Ticket.created_at) == current_month,
            extract('year', model.Ticket.created_at) == current_year
        ).label("monthly_resolved")
    ).outerjoin(model.Ticket, model.Department.department_id == model.Ticket.department_id)\
     .group_by(model.Department.department_name).all()

    report_data = []
    # Uygulama katmanında sadece veriyi formatlıyoruz (0 CPU/IO maliyeti)
    for r in results:
        success_rate = (r.monthly_resolved / r.monthly_total * 100) if r.monthly_total > 0 else 0.0

        report_data.append({
            "department_name": r.department_name,
            "total_assigned": r.total,
            "resolved_count": r.resolved,
            "unresolved_count": r.unresolved,
            "monthly_success_rate": round(float(success_rate), 2)
        })
        
    return report_data