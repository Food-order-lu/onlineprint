// Task Detail API Route
// Path: /api/tasks/[id]

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/tasks/[id] - Get task details
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const { data: tasks, error } = await supabaseAdmin.select<{
            id: string;
            [key: string]: unknown;
        }>('tasks', `id=eq.${id}`);

        if (error) throw new Error(error.message);
        if (!tasks || tasks.length === 0) {
            return NextResponse.json(
                { error: 'Task not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ task: tasks[0] });
    } catch (error) {
        console.error('Error fetching task:', error);
        return NextResponse.json(
            { error: 'Failed to fetch task' },
            { status: 500 }
        );
    }
}

// PATCH /api/tasks/[id] - Update task
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Build update object
        const updates: Record<string, unknown> = {};

        if (body.status !== undefined) {
            updates.status = body.status;
            if (body.status === 'completed') {
                updates.completed_at = new Date().toISOString();
            } else {
                updates.completed_at = null;
            }
        }
        if (body.priority !== undefined) updates.priority = body.priority;
        if (body.title !== undefined) updates.title = body.title;
        if (body.description !== undefined) updates.description = body.description;
        if (body.due_at !== undefined) updates.due_at = body.due_at;
        if (body.assigned_to !== undefined) updates.assigned_to = body.assigned_to;

        const { data, error } = await supabaseAdmin.update(
            'tasks',
            `id=eq.${id}`,
            updates
        );

        if (error) throw new Error(error.message);

        return NextResponse.json({ task: data?.[0] || updates });
    } catch (error) {
        console.error('Error updating task:', error);
        return NextResponse.json(
            { error: 'Failed to update task' },
            { status: 500 }
        );
    }
}

// DELETE /api/tasks/[id] - Delete task
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const { error } = await supabaseAdmin.delete('tasks', `id=eq.${id}`);

        if (error) throw new Error(error.message);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting task:', error);
        return NextResponse.json(
            { error: 'Failed to delete task' },
            { status: 500 }
        );
    }
}
