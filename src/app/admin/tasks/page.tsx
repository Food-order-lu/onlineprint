// Admin Task Manager Page
// Path: /admin/tasks

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    CheckSquare,
    Clock,
    AlertCircle,
    CheckCircle,
    Circle,
    Filter,
    Building2,
    FileText,
    CreditCard,
    Send,
    Receipt,
    Ban,
    Loader2,
    ChevronRight,
    Calendar
} from 'lucide-react';

// Types
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
type TaskType =
    | 'create_deposit_invoice'
    | 'create_final_invoice'
    | 'send_invoice'
    | 'follow_up_payment'
    | 'setup_sepa_mandate'
    | 'send_cancellation'
    | 'generate_monthly_invoice'
    | 'process_gloriafood_report'
    | 'other';

interface Task {
    id: string;
    client_id: string | null;
    project_id: string | null;
    invoice_id: string | null;
    type: TaskType;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    auto_generated: boolean;
    auto_data: Record<string, unknown> | null;
    due_at: string | null;
    completed_at: string | null;
    created_at: string;
    client?: {
        company_name: string;
    };
}

// Task type icons and labels
const taskTypeConfig: Record<TaskType, { icon: typeof FileText; label: string; color: string }> = {
    create_deposit_invoice: { icon: Receipt, label: 'Créer facture acompte', color: 'text-blue-400' },
    create_final_invoice: { icon: Receipt, label: 'Créer facture finale', color: 'text-green-400' },
    send_invoice: { icon: Send, label: 'Envoyer facture', color: 'text-purple-400' },
    follow_up_payment: { icon: CreditCard, label: 'Relance paiement', color: 'text-orange-400' },
    setup_sepa_mandate: { icon: CreditCard, label: 'Config. SEPA', color: 'text-cyan-400' },
    send_cancellation: { icon: Ban, label: 'Envoyer résiliation', color: 'text-red-400' },
    generate_monthly_invoice: { icon: Receipt, label: 'Facture mensuelle', color: 'text-blue-500' },
    process_gloriafood_report: { icon: FileText, label: 'Rapport GloriaFood', color: 'text-orange-500' },
    other: { icon: FileText, label: 'Autre', color: 'text-gray-400' },
};

// Priority badges
const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
    urgent: { label: 'Urgent', className: 'bg-red-50 text-red-600 border-red-100' },
    high: { label: 'Haute', className: 'bg-orange-50 text-orange-600 border-orange-100' },
    medium: { label: 'Moyenne', className: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
    low: { label: 'Basse', className: 'bg-gray-50 text-gray-600 border-gray-200' },
};

// Status icons
const statusConfig: Record<TaskStatus, { icon: typeof Circle; label: string; className: string }> = {
    pending: { icon: Circle, label: 'À faire', className: 'text-gray-400' },
    in_progress: { icon: Clock, label: 'En cours', className: 'text-blue-400' },
    completed: { icon: CheckCircle, label: 'Terminé', className: 'text-green-400' },
    blocked: { icon: AlertCircle, label: 'Bloqué', className: 'text-red-400' },
};

export default function TaskManagerPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
    const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all');

    // Fetch tasks
    useEffect(() => {
        async function fetchTasks() {
            try {
                const params = new URLSearchParams();
                if (statusFilter !== 'all') params.set('status', statusFilter);
                if (typeFilter !== 'all') params.set('type', typeFilter);

                const response = await fetch(`/api/tasks?${params.toString()}`);
                if (!response.ok) throw new Error('Failed to fetch tasks');

                const data = await response.json();
                setTasks(data.tasks);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error loading tasks');
            } finally {
                setLoading(false);
            }
        }

        fetchTasks();
    }, [statusFilter, typeFilter]);

    // Update task status
    async function handleStatusChange(taskId: string, newStatus: TaskStatus) {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) throw new Error('Failed to update task');

            setTasks(prev => prev.map(t =>
                t.id === taskId
                    ? { ...t, status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null }
                    : t
            ));
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Error updating task');
        }
    }

    // Group tasks by status
    const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
    const completedTasks = tasks.filter(t => t.status === 'completed');

    // Stats
    const stats = {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        urgent: tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length,
        dueToday: tasks.filter(t => {
            if (!t.due_at || t.status === 'completed') return false;
            return new Date(t.due_at).toDateString() === new Date().toDateString();
        }).length,
    };

    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <CheckSquare className="text-blue-500" />
                            Gestionnaire de Tâches
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Tâches de facturation et administration
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <p className="text-sm text-gray-400 font-medium">À faire</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pending}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <p className="text-sm text-gray-400 font-medium">En cours</p>
                        <p className="text-2xl font-bold text-blue-600 mt-1">{stats.inProgress}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <p className="text-sm text-gray-400 font-medium">Urgentes</p>
                        <p className="text-2xl font-bold text-red-600 mt-1">{stats.urgent}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <p className="text-sm text-gray-400 font-medium">Échéance aujourd&apos;hui</p>
                        <p className="text-2xl font-bold text-orange-500 mt-1">{stats.dueToday}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 mb-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="relative">
                            <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
                                className="pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
                            >
                                <option value="all">Tous les statuts</option>
                                <option value="pending">À faire</option>
                                <option value="in_progress">En cours</option>
                                <option value="completed">Terminé</option>
                                <option value="blocked">Bloqué</option>
                            </select>
                        </div>

                        <div className="relative">
                            <FileText size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as TaskType | 'all')}
                                className="pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
                            >
                                <option value="all">Tous les types</option>
                                <option value="create_deposit_invoice">Factures acompte</option>
                                <option value="create_final_invoice">Factures finales</option>
                                <option value="send_invoice">Envoi factures</option>
                                <option value="follow_up_payment">Relances paiement</option>
                                <option value="setup_sepa_mandate">Config. SEPA</option>
                                <option value="send_cancellation">Résiliations</option>
                                <option value="generate_monthly_invoice">Factures mensuelles</option>
                                <option value="process_gloriafood_report">Rapports GloriaFood</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="bg-gray-50 rounded-xl border border-gray-100 p-12 text-center">
                        <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-4" />
                        <p className="text-gray-500">Chargement des tâches...</p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <AlertCircle className="text-red-400" />
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {/* Tasks List */}
                {!loading && !error && (
                    <div className="space-y-6">
                        {/* Pending & In Progress */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Clock size={20} className="text-blue-500" />
                                À traiter ({pendingTasks.length})
                            </h2>

                            {pendingTasks.length === 0 ? (
                                <div className="bg-gray-50 rounded-xl border border-gray-100 p-8 text-center">
                                    <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                                    <p className="text-gray-500">Aucune tâche en attente</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {pendingTasks.map((task) => (
                                        <TaskCard
                                            key={task.id}
                                            task={task}
                                            onStatusChange={handleStatusChange}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Completed */}
                        {completedTasks.length > 0 && statusFilter !== 'pending' && statusFilter !== 'in_progress' && (
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <CheckCircle size={20} className="text-green-500" />
                                    Terminées ({completedTasks.length})
                                </h2>

                                <div className="space-y-3">
                                    {completedTasks.slice(0, 5).map((task) => (
                                        <TaskCard
                                            key={task.id}
                                            task={task}
                                            onStatusChange={handleStatusChange}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// =============================================================================
// TASK CARD COMPONENT
// =============================================================================

function TaskCard({
    task,
    onStatusChange
}: {
    task: Task;
    onStatusChange: (id: string, status: TaskStatus) => void;
}) {
    const typeConfig = taskTypeConfig[task.type];
    const TypeIcon = typeConfig.icon;
    const StatusIcon = statusConfig[task.status].icon;

    const isOverdue = task.due_at &&
        new Date(task.due_at) < new Date() &&
        task.status !== 'completed';

    return (
        <div className={`bg-white rounded-xl border ${isOverdue ? 'border-red-200 bg-red-50/10' : 'border-gray-100'
            } p-4 hover:shadow-md transition-all`}>
            <div className="flex items-start gap-4">
                {/* Status checkbox */}
                <button
                    onClick={() => onStatusChange(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                    className={`mt-0.5 ${statusConfig[task.status].className} hover:text-blue-400 transition-colors`}
                >
                    <StatusIcon size={20} />
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <TypeIcon size={16} className={typeConfig.color} />
                                <span className={`text-xs font-semibold ${typeConfig.color}`}>{typeConfig.label}</span>
                            </div>

                            <h3 className={`font-semibold ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'
                                }`}>
                                {task.title}
                            </h3>

                            {task.description && (
                                <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                                    {task.description}
                                </p>
                            )}

                            {/* Meta info */}
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                {task.client?.company_name && (
                                    <span className="flex items-center gap-1">
                                        <Building2 size={12} />
                                        {task.client.company_name}
                                    </span>
                                )}
                                {task.due_at && (
                                    <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : ''}`}>
                                        <Calendar size={12} />
                                        {new Date(task.due_at).toLocaleDateString('fr-FR')}
                                        {isOverdue && ' (en retard)'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Priority badge */}
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${priorityConfig[task.priority].className}`}>
                            {priorityConfig[task.priority].label}
                        </span>
                    </div>
                </div>

                {/* Action */}
                {task.status !== 'completed' && (
                    <Link
                        href={getTaskActionUrl(task)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        <ChevronRight size={20} />
                    </Link>
                )}
            </div>
        </div>
    );
}

// Get action URL based on task type
function getTaskActionUrl(task: Task): string {
    switch (task.type) {
        case 'create_deposit_invoice':
        case 'create_final_invoice':
            return task.project_id
                ? `/admin/projects/${task.project_id}/invoice`
                : `/admin/clients/${task.client_id}/invoice`;
        case 'send_invoice':
            return task.invoice_id
                ? `/admin/invoices/${task.invoice_id}`
                : `/admin/clients/${task.client_id}/invoices`;
        case 'follow_up_payment':
            return `/admin/invoices/${task.invoice_id}`;
        case 'setup_sepa_mandate':
            return `/admin/clients/${task.client_id}`;
        case 'send_cancellation':
            return `/admin/clients/${task.client_id}`;
        case 'generate_monthly_invoice':
            return `/admin/clients/${task.client_id}`;
        case 'process_gloriafood_report':
            return `/admin/clients/${task.client_id}`;
        default:
            return task.client_id
                ? `/admin/clients/${task.client_id}`
                : '/admin/tasks';
    }
}
