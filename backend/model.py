from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, CheckConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base 
from alembic import op


class Department(Base):
    __tablename__ = 'departments'

    department_id = Column(Integer, primary_key=True)
    department_name = Column(String(50), nullable=False, unique=True)

    users = relationship("User", back_populates="department")
    tickets = relationship("Ticket", back_populates="department")

class User(Base):
    __tablename__ = 'users'

    user_id = Column(Integer, primary_key=True)
    department_id = Column(Integer, ForeignKey('departments.department_id', ondelete='SET NULL'))
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False) 
    role = Column(String(20), nullable=False)

    # 'employee' rolü kaldırılarak yerine 'customer' eklendi
    __table_args__ = (
        CheckConstraint("role IN ('customer', 'agent', 'admin')", name='check_user_role'),
    )

    department = relationship("Department", back_populates="users")
    tickets_created = relationship("Ticket", back_populates="requester", foreign_keys='Ticket.user_id')
    assignments = relationship("TicketAssignment", back_populates="agent")
    chat_sessions = relationship("ChatSession", back_populates="user")


class Ticket(Base):
    __tablename__ = 'tickets'

    ticket_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete='RESTRICT'), nullable=False)
    department_id = Column(Integer, ForeignKey('departments.department_id', ondelete='RESTRICT'), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(20), default='open', nullable=False) 
    priority = Column(Integer, default=5, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    parent_ticket_id = Column(Integer, ForeignKey('tickets.ticket_id', ondelete='SET NULL'))

    __table_args__ = (
        CheckConstraint("status IN ('open', 'in_progress', 'resolved', 'closed', 'merged')", name='check_ticket_status'),
        CheckConstraint("priority BETWEEN 1 AND 10", name='check_ticket_priority'),
    )

    requester = relationship("User", back_populates="tickets_created", foreign_keys=[user_id])
    department = relationship("Department", back_populates="tickets")
    assignments = relationship("TicketAssignment", back_populates="ticket", cascade="all, delete-orphan")
    messages = relationship("TicketMessage", back_populates="ticket", cascade="all, delete-orphan")
    attachments = relationship("TicketAttachment", back_populates="ticket", cascade="all, delete-orphan")

class TicketAssignment(Base):
    __tablename__ = 'ticket_assignments'

    ticket_id = Column(Integer, ForeignKey('tickets.ticket_id', ondelete='CASCADE'), primary_key=True)
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE'), primary_key=True)
    is_primary = Column(Boolean, nullable=False, default=False)

    ticket = relationship("Ticket", back_populates="assignments")
    agent = relationship("User", back_populates="assignments")


class TicketMessage(Base):
    __tablename__ = 'ticket_messages'

    message_id = Column(Integer, primary_key=True)
    ticket_id = Column(Integer, ForeignKey('tickets.ticket_id', ondelete='CASCADE'), nullable=False)
    sender_id = Column(Integer, ForeignKey('users.user_id', ondelete='RESTRICT'), nullable=False)
    message_body = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    ticket = relationship("Ticket", back_populates="messages")
    sender = relationship("User")

class TicketAttachment(Base):
    __tablename__ = 'ticket_attachments'

    attachment_id = Column(Integer, primary_key=True)
    ticket_id = Column(Integer, ForeignKey('tickets.ticket_id', ondelete='CASCADE'), nullable=False)
    uploaded_by = Column(Integer, ForeignKey('users.user_id', ondelete='RESTRICT'), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(100), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    ticket = relationship("Ticket", back_populates="attachments")
    uploader = relationship("User")


class ChatSession(Base):
    __tablename__ = 'chat_sessions'

    session_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    conversation_history = Column(JSONB, nullable=False, server_default='[]')
    current_topic = Column(String(100), nullable=True)
    metadata_ = Column('metadata', JSONB, nullable=False, server_default='{}') 
    
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="chat_sessions")

class LogTable(Base):
    __tablename__ = 'log_table'

    log_id = Column(Integer, primary_key=True)
    changed_by = Column(Integer, ForeignKey('users.user_id', ondelete='SET NULL'), nullable=True)
    table_name = Column(String(50), nullable=False)
    record_id = Column(Integer, nullable=False)
    action = Column(String(10), nullable=False) 
    
    old_data = Column(JSONB, nullable=True)
    new_data = Column(JSONB, nullable=True)
    
    changed_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint("action IN ('INSERT', 'UPDATE', 'DELETE')", name='check_log_action'),
    )

    modifier = relationship("User")