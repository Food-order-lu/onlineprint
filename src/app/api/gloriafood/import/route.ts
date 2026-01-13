import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { CommissionConfig } from '@/lib/db/types';
import { exec } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { promisify } from 'util';
import { randomUUID } from 'crypto';

const execAsync = promisify(exec);

// Helper to parse French month
function getMonthNumber(monthStr: string): string {
    const months: { [key: string]: string } = {
        'janvier': '01', 'fevrier': '02', 'février': '02', 'mars': '03', 'avril': '04',
        'mai': '05', 'juin': '06', 'juillet': '07', 'aout': '08', 'août': '08',
        'septembre': '09', 'octobre': '10', 'novembre': '11', 'decembre': '12', 'décembre': '12'
    };
    return months[monthStr.toLowerCase()] || '01';
}

// Commission calculation using hybrid system
function calculateCommission(revenue: number, config: CommissionConfig | null): number {
    if (!config) return 0;

    if (config.type === 'legacy_fixed') {
        return config.fixed_amount || 0;
    }

    if (config.type === 'legacy_percent') {
        return revenue * (config.percent || 0) / 100;
    }

    // Hybrid: base_fee if below threshold, base_fee + percent of excess if above
    const threshold = config.threshold || 1000;
    const baseFee = config.base_fee || 60;
    const percent = config.percent || 7;

    if (revenue <= threshold) {
        return baseFee;
    }

    const above = revenue - threshold;
    return baseFee + (above * percent / 100);
}

// POST /api/gloriafood/import
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const fileName = file.name.toLowerCase();
        let parsedData: any[] = [];

        if (fileName.endsWith('.csv')) {
            const text = await file.text();
            const lines = text.trim().split('\n');

            if (lines.length < 2) {
                return NextResponse.json({ error: 'CSV file is empty or invalid' }, { status: 400 });
            }

            // Parse header
            const header = lines[0].toLowerCase().split(',').map(h => h.trim());
            const clientNameIdx = header.findIndex(h => h.includes('client') || h.includes('restaurant') || h.includes('name'));
            const monthIdx = header.findIndex(h => h.includes('month') || h.includes('mois') || h.includes('period'));
            const ordersIdx = header.findIndex(h => h.includes('order') || h.includes('commande'));
            const revenueIdx = header.findIndex(h => h.includes('revenue') || h.includes('ca') || h.includes('turnover') || h.includes('chiffre'));

            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));

                if (cols.length < 3) continue;

                const clientName = clientNameIdx >= 0 ? cols[clientNameIdx] : cols[0];
                const month = monthIdx >= 0 ? cols[monthIdx] : cols[1];
                const orders = ordersIdx >= 0 ? parseInt(cols[ordersIdx]) || 0 : parseInt(cols[2]) || 0;
                const revenue = revenueIdx >= 0 ? parseFloat(cols[revenueIdx]) || 0 : parseFloat(cols[3]) || 0;

                parsedData.push({ client_name: clientName, month, orders, revenue, raw_row: lines[i] });
            }
        } else if (fileName.endsWith('.pdf')) {
            // PDF Parsing Logic using pdftotext (system command)
            const buffer = Buffer.from(await file.arrayBuffer());
            const tempId = randomUUID();
            const tempPath = join('/tmp', `gloriafood_${tempId}.pdf`);

            try {
                // Write buffer to temp file
                await writeFile(tempPath, buffer);

                // Execute pdftotext
                const { stdout, stderr } = await execAsync(`pdftotext "${tempPath}" -`);

                if (stderr && stderr.trim().length > 0 && !stdout) {
                    console.error('pdftotext stderr:', stderr);
                    // Assume fail if no stdout
                }

                const text = stdout;
                console.log('PDF Text extracted:', text.substring(0, 500)); // Log first 500 chars

                // Extract data using Regex
                // Regex Logic Improved

                // 1. Date
                const dateMatch = text.match(/(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+(\d{4})/i);
                console.log('Date match:', dateMatch);

                // 2. Client Name
                // Prioritize explicit "Nom du Restaurant:"
                const restaurantMatchExplicit = text.match(/Nom du Restaurant:\s*([^\n—]+)/i); // Stop at em-dash or newline
                let clientName = 'Unknown';

                if (restaurantMatchExplicit) {
                    clientName = restaurantMatchExplicit[1].trim();
                } else {
                    // Fallback to "pour [Name]" but exclude if it matches the date string
                    const pourMatch = text.match(/pour\s+([^\n]+)/i);
                    if (pourMatch) {
                        const potentialName = pourMatch[1].trim();
                        // Ignore if it looks like a date (month year)
                        const isDate = /(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+\d{4}/i.test(potentialName);
                        if (!isDate) {
                            clientName = potentialName;
                        }
                    }
                }
                console.log('Client name:', clientName);

                const salesMatch = text.match(/Ventes:\s*€\s*([\d\.,]+)/i);
                console.log('Sales match:', salesMatch);

                const ordersMatch = text.match(/Commandes\s*[\n\r]*\s*(\d+)/i);
                console.log('Orders match:', ordersMatch);

                if (dateMatch) {
                    const monthStr = dateMatch[1];
                    const year = dateMatch[2];
                    const monthNum = getMonthNumber(monthStr);
                    const month = `${year}-${monthNum}-01`; // Ensure DATE format YYYY-MM-01
                    console.log('Parsed Month:', month);

                    let revenue = 0;
                    if (salesMatch) {
                        const cleanSales = salesMatch[1].replace(/\./g, '').replace(',', '.');
                        revenue = parseFloat(cleanSales);
                    }

                    const orders = ordersMatch ? parseInt(ordersMatch[1]) : 0;

                    parsedData.push({ client_name: clientName, month, orders, revenue, raw_row: 'PDF Import via pdftotext' });
                } else {
                    console.error('Date parsing failed');
                }

            } catch (err) {
                console.error('PDftotext error:', err);
                throw new Error('Failed to parse PDF file');
            } finally {
                // Cleanup
                try {
                    await unlink(tempPath);
                } catch (e) { /* ignore */ }
            }

        } else {
            return NextResponse.json({ error: 'Unsupported file format. Please upload .csv or .pdf' }, { status: 400 });
        }

        const results: any[] = [];
        const errors: string[] = [];

        for (const row of parsedData) {
            // Try to find matching client by name (case insensitive)
            const { data: clients } = await supabaseAdmin.select<any>(
                'clients',
                `company_name=ilike.*${row.client_name}*`
            );

            const matchedClient = clients && clients.length > 0 ? clients[0] : null;

            // Calculate commission if client matched
            let commissionAmount = 0;
            let status = 'pending_match';

            if (matchedClient) {
                commissionAmount = calculateCommission(row.revenue, matchedClient.commission_config);
                status = 'ready';
            }

            const averageOrder = row.orders > 0 ? row.revenue / row.orders : 0;

            // Upsert report
            const reportData = {
                client_id: matchedClient?.id || null,
                client_name: row.client_name,
                report_month: row.month,
                total_orders: row.orders,
                average_order: Math.round(averageOrder * 100) / 100,
                total_revenue: row.revenue,
                commission_amount: Math.round(commissionAmount * 100) / 100,
                status,
                raw_data: { original_row: row.raw_row, source: fileName.endsWith('.pdf') ? 'pdf' : 'csv' },
                updated_at: new Date().toISOString()
            };

            // Check if exists
            const existingQuery = matchedClient
                ? `client_id=eq.${matchedClient.id}&report_month=eq.${row.month}`
                : `client_name=eq.${row.client_name}&report_month=eq.${row.month}&client_id=is.null`;

            const { data: existing } = await supabaseAdmin.selectOne<any>('gloriafood_reports', existingQuery);

            if (existing) {
                await supabaseAdmin.update('gloriafood_reports', `id=eq.${existing.id}`, reportData);
                results.push({ ...reportData, action: 'updated', client_matched: !!matchedClient });
            } else {
                await supabaseAdmin.insert('gloriafood_reports', {
                    ...reportData,
                    created_at: new Date().toISOString()
                });
                results.push({ ...reportData, action: 'created', client_matched: !!matchedClient });
            }
        }

        return NextResponse.json({
            success: true,
            imported: results.length,
            results,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error: any) {
        console.error('Import error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
