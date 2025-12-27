-- Projects/Tasks Extension for Rivego Automation System
-- Tracks client projects and pending final invoices

-- =============================================================================
-- PROJECTS TABLE
-- =============================================================================

CREATE TYPE project_status AS ENUM ('pending', 'in_progress', 'completed', 'on_hold', 'cancelled');

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    
    -- Project info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status project_status DEFAULT 'pending',
    
    -- Pricing
    total_amount DECIMAL(10,2) NOT NULL,
    deposit_percent DECIMAL(5,2) DEFAULT 20,
    deposit_amount DECIMAL(10,2),
    deposit_paid BOOLEAN DEFAULT FALSE,
    deposit_invoice_id VARCHAR(100), -- Zoho invoice ID
    
    -- Final invoice (created when project completed)
    balance_amount DECIMAL(10,2),
    balance_invoice_id VARCHAR(100), -- Zoho invoice ID
    balance_invoice_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'draft_created', 'sent', 'paid'
    
    -- Dates
    started_at DATE,
    estimated_completion DATE,
    completed_at DATE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_balance_status ON projects(balance_invoice_status);

-- Trigger for updated_at
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- TASKS TABLE (for task manager)
-- =============================================================================

CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'blocked');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_type AS ENUM (
    'create_deposit_invoice',
    'create_final_invoice', 
    'send_invoice',
    'follow_up_payment',
    'setup_sepa_mandate',
    'send_cancellation',
    'other'
);

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Related entities (optional)
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    
    -- Task info
    type task_type DEFAULT 'other',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    status task_status DEFAULT 'pending',
    priority task_priority DEFAULT 'medium',
    
    -- Auto-generated task data
    auto_generated BOOLEAN DEFAULT FALSE,
    auto_data JSONB, -- Data needed to complete the task
    
    -- Dates
    due_at DATE,
    completed_at TIMESTAMPTZ,
    
    -- Assignment
    assigned_to VARCHAR(255), -- Admin email
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_client ON tasks(client_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_type ON tasks(type);
CREATE INDEX idx_tasks_due ON tasks(due_at);

-- Trigger for updated_at
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- FUNCTION: Create final invoice task when project is completed
-- =============================================================================

CREATE OR REPLACE FUNCTION create_final_invoice_task()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger when status changes to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Calculate balance amount
        NEW.balance_amount := NEW.total_amount - COALESCE(NEW.deposit_amount, 0);
        NEW.balance_invoice_status := 'pending';
        
        -- Create a task for creating the final invoice
        INSERT INTO tasks (
            client_id,
            project_id,
            type,
            title,
            description,
            status,
            priority,
            auto_generated,
            auto_data,
            due_at
        ) VALUES (
            NEW.client_id,
            NEW.id,
            'create_final_invoice',
            'Créer facture finale - ' || NEW.name,
            'Le projet "' || NEW.name || '" est terminé. Créer la facture de solde (' || NEW.balance_amount || '€) en brouillon.',
            'pending',
            'high',
            TRUE,
            jsonb_build_object(
                'project_id', NEW.id,
                'project_name', NEW.name,
                'total_amount', NEW.total_amount,
                'deposit_amount', NEW.deposit_amount,
                'balance_amount', NEW.balance_amount,
                'deposit_invoice_id', NEW.deposit_invoice_id
            ),
            CURRENT_DATE + INTERVAL '1 day'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_final_invoice_task
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION create_final_invoice_task();

-- =============================================================================
-- FUNCTION: Create deposit invoice task when project is created
-- =============================================================================

CREATE OR REPLACE FUNCTION create_deposit_invoice_task()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate deposit amount
    NEW.deposit_amount := (NEW.total_amount * NEW.deposit_percent) / 100;
    
    -- Create a task for creating the deposit invoice
    INSERT INTO tasks (
        client_id,
        project_id,
        type,
        title,
        description,
        status,
        priority,
        auto_generated,
        auto_data,
        due_at
    ) VALUES (
        NEW.client_id,
        NEW.id,
        'create_deposit_invoice',
        'Créer facture d''acompte - ' || NEW.name,
        'Créer la facture d''acompte (' || NEW.deposit_percent || '% = ' || NEW.deposit_amount || '€) pour le projet "' || NEW.name || '".',
        'pending',
        'high',
        TRUE,
        jsonb_build_object(
            'project_id', NEW.id,
            'project_name', NEW.name,
            'total_amount', NEW.total_amount,
            'deposit_percent', NEW.deposit_percent,
            'deposit_amount', NEW.deposit_amount
        ),
        CURRENT_DATE
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_deposit_invoice_task
    BEFORE INSERT ON projects
    FOR EACH ROW EXECUTE FUNCTION create_deposit_invoice_task();
