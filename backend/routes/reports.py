from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime
from database import get_db
import model
from pydantic import BaseModel
from routes.auth import RoleChecker 

router = APIRouter(prefix="/reports", tags=["Reports"])

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

    results = db.query(
        model.Department.department_name,
        func.count(model.Ticket.ticket_id).label("total"),
        func.count(model.Ticket.ticket_id).filter(model.Ticket.status == 'resolved').label("resolved"),
        func.count(model.Ticket.ticket_id).filter(model.Ticket.status != 'resolved').label("unresolved")
    ).join(model.Ticket, model.Department.department_id == model.Ticket.department_id, isouter=True)\
     .group_by(model.Department.department_name).all()

    report_data = []
    for r in results:
        dept_monthly_total = db.query(func.count(model.Ticket.ticket_id)).filter(
            model.Ticket.department_id == db.query(model.Department.department_id).filter(model.Department.department_name == r.department_name).scalar(),
            extract('month', model.Ticket.created_at) == current_month,
            extract('year', model.Ticket.created_at) == current_year
        ).scalar() or 0
        
        dept_monthly_resolved = db.query(func.count(model.Ticket.ticket_id)).filter(
            model.Ticket.department_id == db.query(model.Department.department_id).filter(model.Department.department_name == r.department_name).scalar(),
            extract('month', model.Ticket.created_at) == current_month,
            extract('year', model.Ticket.created_at) == current_year,
            model.Ticket.status == 'resolved'
        ).scalar() or 0
        
        success_rate = (dept_monthly_resolved / dept_monthly_total * 100) if dept_monthly_total > 0 else 0.0

        report_data.append({
            "department_name": r.department_name,
            "total_assigned": r.total,
            "resolved_count": r.resolved,
            "unresolved_count": r.unresolved,
            "monthly_success_rate": round(float(success_rate), 2)
        })
        
    return report_data