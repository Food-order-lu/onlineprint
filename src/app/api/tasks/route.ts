// Tasks API Route
// Path: /api/tasks

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';
type TaskType = string;

interface Task {
    id: string;
    client_id: string | null;
    project_id: string | null;
    invoice_id: string | null;
    type: TaskType;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: string;
    auto_generated: boolean;
    auto_data: Record<string, unknown> | null;
    due_at: string | null;
    completed_at: string | null;
    created_at: string;
}

// GET /api/tasks - List all tasks
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status');
        const type = searchParams.get('type');

        let query = 'select=*&order=due_at.asc.nullslast,priority.desc,created_at.desc';

        if (status) {
            query += `&status=eq.${status}`;
        }
        if (type) {
            query += `&type=eq.${type}`;
        }

        const { data: tasks, error } = await supabaseAdmin.select<Task>('tasks', query);

        if (error) throw new Error(error.message);

        // Enrich with client info
        const enrichedTasks = await Promise.all((tasks || []).map(async (task) => {
            if (task.client_id) {
                const { data: clients } = await supabaseAdmin.select<{ company_name: string }>(
                    'clients',
                    `id=eq.${task.client_id}&select=company_name`
                );
                if (clients && clients.length > 0) {
                    return { ...task, client: { company_name: clients[0].company_name } };
                }
            }
            return task;
        }));

        return NextResponse.json({ tasks: enrichedTasks });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tasks' },
            { status: 500 }
        );
    }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { error, data } = await supabaseAdmin.insert('tasks', {
            client_id: body.client_id || null,
            project_id: body.project_id || null,
            invoice_id: body.invoice_id || null,
            type: body.type || 'other',
            title: body.title,
            description: body.description || null,
            status: body.status || 'pending',
            priority: body.priority || 'medium',
            auto_generated: false,
            due_at: body.due_at || null,
        });

        if (error) throw new Error(error.message);

        return NextResponse.json({ task: data?.[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating task:', error);
        return NextResponse.json(
            { error: 'Failed to create task' },
            { status: 500 }
        );
    }
}
