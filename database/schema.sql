-- =====================================================================
-- AI-Powered Corporate Helpdesk & Ticketing System
-- PostgreSQL Schema (based on the project UML)
-- Target: PostgreSQL 14+
-- =====================================================================

-- Drop in reverse FK order (safe re-run while developing)
DROP TABLE IF EXISTS log_table          CASCADE;
DROP TABLE IF EXISTS ticket_attachments CASCADE;
DROP TABLE IF EXISTS ticket_messages    CASCADE;
DROP TABLE IF EXISTS chat_sessions      CASCADE;
DROP TABLE IF EXISTS ticket_assignments CASCADE;
DROP TABLE IF EXISTS tickets            CASCADE;
DROP TABLE IF EXISTS users              CASCADE;
DROP TABLE IF EXISTS departments        CASCADE;


-- =====================================================================
-- 1) departments
-- The 4 fixed departments from the project doc:
--    IT & Hardware, DevOps & Software, FinOps, HR & Admin
-- =====================================================================
CREATE TABLE departments (
    department_id   SERIAL PRIMARY KEY,
    department_name VARCHAR(50) NOT NULL UNIQUE
);


-- =====================================================================
-- 2) users
-- Employees, agents (department staff), and admins.
-- department_id is nullable: regular employees may not belong to a
-- support department.
-- =====================================================================
CREATE TABLE users (
    user_id       SERIAL       PRIMARY KEY,
    department_id INTEGER      REFERENCES departments(department_id) ON DELETE SET NULL,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(100) NOT NULL UNIQUE,
    role          VARCHAR(20)  NOT NULL
                  CHECK (role IN ('employee', 'agent', 'admin'))
);

CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_role       ON users(role);


-- =====================================================================
-- 3) tickets
-- Core entity. parent_ticket_id supports the "Clone Ticket Catcher"
-- feature (mass outage merging). priority is the AI-assigned urgency
-- score (1-10) used by the priority queue.
-- =====================================================================
CREATE TABLE tickets (
    ticket_id        SERIAL      PRIMARY KEY,
    user_id          INTEGER     NOT NULL REFERENCES users(user_id)              ON DELETE RESTRICT,
    department_id    INTEGER     NOT NULL REFERENCES departments(department_id)  ON DELETE RESTRICT,
    description      TEXT        NOT NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'open'
                     CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'merged')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at      TIMESTAMPTZ,
    parent_ticket_id INTEGER     REFERENCES tickets(ticket_id) ON DELETE SET NULL,
    priority         INTEGER     NOT NULL DEFAULT 5
                     CHECK (priority BETWEEN 1 AND 10),

    CONSTRAINT chk_resolved_after_created
        CHECK (resolved_at IS NULL OR resolved_at >= created_at),
    CONSTRAINT chk_no_self_parent
        CHECK (parent_ticket_id IS NULL OR parent_ticket_id <> ticket_id)
);

-- Hot path: agents pulling their department's open queue ordered by priority
CREATE INDEX idx_tickets_dept_status_priority
    ON tickets(department_id, status, priority DESC, created_at ASC);

CREATE INDEX idx_tickets_user        ON tickets(user_id);
CREATE INDEX idx_tickets_parent      ON tickets(parent_ticket_id);
CREATE INDEX idx_tickets_created_at  ON tickets(created_at DESC);


-- =====================================================================
-- 4) ticket_assignments
-- Many-to-many between tickets and agents. is_primary marks the
-- currently responsible agent (only one primary per ticket).
-- =====================================================================
CREATE TABLE ticket_assignments (
    ticket_id  INTEGER NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES users(user_id)     ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (ticket_id, user_id)
);

-- At most one primary assignee per ticket
CREATE UNIQUE INDEX uq_ticket_primary_assignee
    ON ticket_assignments(ticket_id) WHERE is_primary = TRUE;

CREATE INDEX idx_assignments_user ON ticket_assignments(user_id);


-- =====================================================================
-- 5) chat_sessions
-- Conversational AI sessions. conversation_history and metadata are
-- JSONB for flexibility (LLM message arrays, auto-context payloads,
-- detected intent, etc.). One session can produce 0..N tickets.
-- =====================================================================
CREATE TABLE chat_sessions (
    session_id           SERIAL       PRIMARY KEY,
    user_id              INTEGER      NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    conversation_history JSONB        NOT NULL DEFAULT '[]'::jsonb,
    current_topic        VARCHAR(100),
    metadata             JSONB        NOT NULL DEFAULT '{}'::jsonb,
    start_time           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    end_time             TIMESTAMPTZ,

    CONSTRAINT chk_session_end_after_start
        CHECK (end_time IS NULL OR end_time >= start_time)
);

CREATE INDEX idx_sessions_user        ON chat_sessions(user_id);
CREATE INDEX idx_sessions_start_time  ON chat_sessions(start_time DESC);
CREATE INDEX idx_sessions_metadata    ON chat_sessions USING GIN (metadata);


-- =====================================================================
-- 6) ticket_messages
-- Threaded conversation on a ticket between requester and agent(s).
-- =====================================================================
CREATE TABLE ticket_messages (
    message_id   SERIAL      PRIMARY KEY,
    ticket_id    INTEGER     NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    sender_id    INTEGER     NOT NULL REFERENCES users(user_id)     ON DELETE RESTRICT,
    message_body TEXT        NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_ticket_time ON ticket_messages(ticket_id, created_at);
CREATE INDEX idx_messages_sender      ON ticket_messages(sender_id);


-- =====================================================================
-- 7) ticket_attachments
-- Files attached to a ticket (logs, screenshots, etc.).
-- =====================================================================
CREATE TABLE ticket_attachments (
    attachment_id SERIAL       PRIMARY KEY,
    ticket_id     INTEGER      NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    uploaded_by   INTEGER      NOT NULL REFERENCES users(user_id)     ON DELETE RESTRICT,
    file_name     VARCHAR(255) NOT NULL,
    file_path     VARCHAR(500) NOT NULL,
    file_type     VARCHAR(100) NOT NULL,
    uploaded_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attachments_ticket ON ticket_attachments(ticket_id);


-- =====================================================================
-- 8) log_table
-- Generic audit log. record_id is not a hard FK (table_name varies).
-- old_data / new_data store row snapshots for diffing.
-- =====================================================================
CREATE TABLE log_table (
    log_id       SERIAL       PRIMARY KEY,
    changed_by   INTEGER      REFERENCES users(user_id) ON DELETE SET NULL,
    table_name   VARCHAR(50)  NOT NULL,
    record_id    INTEGER      NOT NULL,
    action       VARCHAR(10)  NOT NULL
                 CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data     JSONB,
    new_data     JSONB,
    changed_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_log_table_record  ON log_table(table_name, record_id);
CREATE INDEX idx_log_changed_at    ON log_table(changed_at DESC);
CREATE INDEX idx_log_changed_by    ON log_table(changed_by);


-- =====================================================================
-- Seed: 4 fixed departments from the project doc
-- =====================================================================
INSERT INTO departments (department_name) VALUES
    ('IT & Hardware Support'),
    ('DevOps & Software'),
    ('Financial Operations'),
    ('HR & Admin')
ON CONFLICT (department_name) DO NOTHING;


-- =====================================================================
-- Convenience view: priority queue per department
-- This is what the agent Kanban panel reads from (ISE optimization
-- target — ordered by AI urgency, NOT FIFO).
-- =====================================================================
CREATE OR REPLACE VIEW v_priority_queue AS
SELECT
    t.ticket_id,
    t.department_id,
    d.department_name,
    t.user_id        AS requester_id,
    u.full_name      AS requester_name,
    t.description,
    t.status,
    t.priority,
    t.created_at,
    EXTRACT(EPOCH FROM (NOW() - t.created_at)) / 60 AS waiting_minutes
FROM tickets t
JOIN departments d ON d.department_id = t.department_id
JOIN users       u ON u.user_id       = t.user_id
WHERE t.status IN ('open', 'in_progress')
ORDER BY t.department_id, t.priority DESC, t.created_at ASC;


-- =====================================================================
-- Convenience view: SLA stats (ISE bottleneck analysis input)
-- =====================================================================
CREATE OR REPLACE VIEW v_sla_stats AS
SELECT
    d.department_id,
    d.department_name,
    COUNT(*) FILTER (WHERE t.status = 'resolved')                 AS resolved_count,
    COUNT(*) FILTER (WHERE t.status IN ('open', 'in_progress'))   AS open_count,
    AVG(EXTRACT(EPOCH FROM (t.resolved_at - t.created_at)) / 60)
        FILTER (WHERE t.resolved_at IS NOT NULL)                  AS avg_resolution_minutes,
    AVG(t.priority)                                               AS avg_priority
FROM departments d
LEFT JOIN tickets t ON t.department_id = d.department_id
GROUP BY d.department_id, d.department_name;
