// Task Generator Utility
// Path: /lib/tasks/generator.ts
// Generates step-by-step tasks based on the project plan

import { supabaseAdmin } from '@/lib/db/supabase';

type ProjectPlan = 'essentiel' | 'business' | 'premium';

interface TaskTemplate {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDays: number; // Days from start
}

// Plan 1: Site Vitrine (Simple)
const PLAN_ESSENTIEL_TASKS: TaskTemplate[] = [
    { title: 'Configuration Domaine & DNS', description: 'Acheter ou configurer le domaine, pointer vers Netlify/Vercel.', priority: 'high', dueDays: 1 },
    { title: 'Setup Projet Next.js', description: 'Initialiser repo, installer dépendances, configurer Tailwind.', priority: 'high', dueDays: 1 },
    { title: 'Design Homepage (Vitrine)', description: 'Créer la maquette et intégrer la page d\'accueil unique.', priority: 'medium', dueDays: 3 },
    { title: 'Formulaire de Contact', description: 'Intégrer formulaire fonctionnel (API route ou service externe).', priority: 'medium', dueDays: 4 },
    { title: 'Contenu & Mentions Légales', description: 'Intégrer les textes clients et pages légales obligatoires.', priority: 'low', dueDays: 5 },
    { title: 'Mise en ligne & Test SSL', description: 'Déployer, vérifier HTTPS et responsiveness.', priority: 'urgent', dueDays: 7 },
];

// Plan 2: Site Complet (Multi-pages style Chez Zhang/Trapeneck)
const PLAN_BUSINESS_TASKS: TaskTemplate[] = [
    { title: 'Configuration Domaine & DNS', description: 'Configurer domaine et emails.', priority: 'high', dueDays: 1 },
    { title: 'Setup Projet & Design System', description: 'Setup Next.js, configurer couleurs/typo du client.', priority: 'high', dueDays: 2 },
    { title: 'Page Accueil (Hero + Présentation)', description: 'Intégration section Hero attractive, À propos.', priority: 'medium', dueDays: 4 },
    { title: 'Page Menu / Carte', description: 'Créer une page menu structurée et facile à lire.', priority: 'medium', dueDays: 5 },
    { title: 'Galerie Photos', description: 'Intégrer les photos HD avec visionneuse (lightbox).', priority: 'medium', dueDays: 6 },
    { title: 'Système Commande (Widget)', description: 'Intégrer GloriaFood ou autre widget de commande.', priority: 'high', dueDays: 7 },
    { title: 'SEO & Optimisation', description: 'Meta tags, sitemap, optimisation images.', priority: 'medium', dueDays: 8 },
    { title: 'Recette & Mise en ligne', description: 'Validation client et déploiement final.', priority: 'urgent', dueDays: 10 },
];

// Plan 3: Sur Mesure / Système (Premium)
const PLAN_PREMIUM_TASKS: TaskTemplate[] = [
    { title: 'Architecture & Base de données', description: 'Définir schéma BDD (Supabase), modèles de données.', priority: 'urgent', dueDays: 2 },
    { title: 'Setup Projet Fullstack', description: 'Next.js + API Routes + Auth + DB connect.', priority: 'high', dueDays: 3 },
    { title: 'Back-office Admin', description: 'Créer panel admin pour gestion contenu (ex: Menu semaine).', priority: 'high', dueDays: 7 },
    { title: 'Frontend - Interface Client', description: 'Intégration UI premium, animations, UX soignée.', priority: 'medium', dueDays: 10 },
    { title: 'Système Avancé (Spécifique)', description: 'Dév fonctionnalitée sur mesure (ex: système upload, réservations complexes).', priority: 'high', dueDays: 12 },
    { title: 'Tests Sécurité & Performance', description: 'Audit sécurité, tests charges, optimisation requêtes.', priority: 'high', dueDays: 14 },
    { title: 'Formation Client', description: 'Préparer guide ou vidéo pour utiliser le back-office.', priority: 'medium', dueDays: 15 },
    { title: 'Mise en Prod & Monitoring', description: 'Déploiement production, setup logs et monitoring.', priority: 'urgent', dueDays: 20 },
];

export async function generateProjectTasks(projectId: string, clientId: string, planId: string) {
    let templates: TaskTemplate[] = [];

    // Determine tasks based on plan ID
    switch (planId) {
        case 'essentiel':
            templates = PLAN_ESSENTIEL_TASKS;
            break;
        case 'business':
            templates = PLAN_BUSINESS_TASKS;
            break;
        case 'premium':
            templates = PLAN_PREMIUM_TASKS;
            break;
        default:
            // Default to Business if unknown or 'supplements' (assuming supplements might need setup too, or handle separately)
            if (planId !== 'supplements') {
                templates = PLAN_BUSINESS_TASKS;
            }
            break;
    }

    if (templates.length === 0) return;

    const today = new Date();

    const tasksToInsert = templates.map(tmpl => {
        const dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + tmpl.dueDays);

        return {
            client_id: clientId,
            project_id: projectId,
            type: 'project_task', // New type we should ensure exists or is 'other'
            title: tmpl.title,
            description: tmpl.description,
            status: 'pending',
            priority: tmpl.priority,
            auto_generated: true,
            due_at: dueDate.toISOString().split('T')[0], // YYYY-MM-DD
        };
    });

    const { error } = await supabaseAdmin.insert('tasks', tasksToInsert);

    if (error) {
        console.error('Error generating project tasks:', error);
        throw new Error('Failed to generate project tasks');
    }

    console.log(`Generated ${tasksToInsert.length} tasks for project ${projectId} (Plan: ${planId})`);
}
