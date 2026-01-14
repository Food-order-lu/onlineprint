
'use client';

import { useState, useRef, useEffect } from 'react';
import { Save, FileText, X, Send } from 'lucide-react';
import { generateQuotePDF } from './QuotePDF';

interface FieldConfig {
    name: string;
    key: string;
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
}

interface QuoteSignatureAdjusterProps {
    isOpen: boolean;
    onClose: () => void;
    quoteData: any;
    quoteNumber: string;
    // Default initial config (from .env normally, but passed here or hardcoded defaults if missing)
    initialConfig?: any;
}

export default function QuoteSignatureAdjuster({ isOpen, onClose, quoteData, quoteNumber, initialConfig }: QuoteSignatureAdjusterProps) {
    const [loading, setLoading] = useState(false);

    // Initial fields based on .env defaults (or fallback)
    // We assume the caller might pass these, or we use standard defaults
    // Actually, we can't easily access .env on client side unless passed as props or via API
    // For now, we use the "standard" defaults matching the .env we just set.
    const standardFields: FieldConfig[] = [
        { name: 'Mention (Bon pour accord)', key: 'MENTION', x: 0.043, y: 0.733, w: 0.40, h: 0.03, color: 'bg-blue-500' },
        { name: 'Date', key: 'DATE', x: 0.687, y: 0.735, w: 0.25, h: 0.03, color: 'bg-green-500' },
        { name: 'Signature Client', key: 'SIGNATURE', x: 0.05, y: 0.835, w: 0.45, h: 0.06, color: 'bg-purple-500' },
    ];

    const [fields, setFields] = useState<FieldConfig[]>(standardFields);
    const [dragging, setDragging] = useState<{ index: number, startX: number, startY: number, startFieldX: number, startFieldY: number } | null>(null);
    const [resizing, setResizing] = useState<{ index: number, startX: number, startY: number, startFieldW: number, startFieldH: number } | null>(null);
    const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

    const pageRef = useRef<HTMLDivElement>(null);

    // Generate PDF Preview on mount
    useEffect(() => {
        if (isOpen && quoteData) {
            generateQuotePDF(quoteData).then(blob => {
                const url = URL.createObjectURL(blob);
                setPreviewPdfUrl(url);
            });
        }
        return () => {
            if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
        };
    }, [isOpen, quoteData]);

    // Mouse Move Handler (Same as Config Page)
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!pageRef.current) return;
            const rect = pageRef.current.getBoundingClientRect();
            const mouseXRel = (e.clientX - rect.left) / rect.width;
            const mouseYRel = (e.clientY - rect.top) / rect.height;

            if (dragging !== null) {
                const dx = mouseXRel - dragging.startX;
                const dy = mouseYRel - dragging.startY;

                const newFields = [...fields];
                newFields[dragging.index].x = Math.max(0, Math.min(1 - newFields[dragging.index].w, dragging.startFieldX + dx));
                newFields[dragging.index].y = Math.max(0, Math.min(1 - newFields[dragging.index].h, dragging.startFieldY + dy));
                setFields(newFields);
            }

            if (resizing !== null) {
                const dx = mouseXRel - resizing.startX;
                const dy = mouseYRel - resizing.startY;

                const newFields = [...fields];
                newFields[resizing.index].w = Math.max(0.01, resizing.startFieldW + dx);
                newFields[resizing.index].h = Math.max(0.01, resizing.startFieldH + dy);
                setFields(newFields);
            }
        };

        const handleMouseUp = () => {
            setDragging(null);
            setResizing(null);
        };

        if (dragging !== null || resizing !== null) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, resizing, fields]);

    const handleSign = async () => {
        setLoading(true);
        try {
            // 1. Generate PDF
            const blob = await generateQuotePDF(quoteData);

            // 2. Convert to Base64
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64data = reader.result?.toString().split(',')[1];
                if (!base64data) throw new Error('Failed to convert PDF');

                // 3. Prepare Override Config
                // We map our current fields state to what the API expects
                // The API needs to handle these overrides! (I will need to update the API too)
                const fieldOverrides = {
                    mention: fields.find(f => f.key === 'MENTION'),
                    date: fields.find(f => f.key === 'DATE'),
                    signature: fields.find(f => f.key === 'SIGNATURE'),
                };

                // 4. Call API
                const res = await fetch('/api/invoicing/sign-docuseal', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        pdf_base64: base64data,
                        client_email: quoteData.clientEmail,
                        client_name: quoteData.clientName,
                        client_company: quoteData.clientCompany,
                        client_phone: quoteData.clientPhone,
                        clientAddress: quoteData.clientAddress,
                        vatNumber: quoteData.clientVat,
                        quote_number: quoteNumber,
                        quote_data: {
                            // ... pass minimal needed data ...
                            subtotal: quoteData.subtotal,
                            vatRate: quoteData.vatRate,
                            vatAmount: quoteData.vatAmount,
                            totalTtc: quoteData.totalTtc,
                            discountPercent: quoteData.discountPercent,
                            discountAmount: quoteData.discountAmount,
                            monthlyTotal: quoteData.monthlyTotal,
                            // Pass items so backend can start recurring subs
                            monthlyItems: quoteData.monthlyItems,
                            oneTimeItems: quoteData.oneTimeItems,
                            startDate: quoteData.startDate
                        },
                        // PASS CUSTOM FIELDS HERE
                        field_overrides: {
                            mention: { x: fieldOverrides.mention?.x, y: fieldOverrides.mention?.y, w: fieldOverrides.mention?.w, h: fieldOverrides.mention?.h },
                            date: { x: fieldOverrides.date?.x, y: fieldOverrides.date?.y, w: fieldOverrides.date?.w, h: fieldOverrides.date?.h },
                            signature: { x: fieldOverrides.signature?.x, y: fieldOverrides.signature?.y, w: fieldOverrides.signature?.w, h: fieldOverrides.signature?.h },
                        }
                    })
                });

                const json = await res.json();
                if (json.success && json.url) {
                    window.location.href = json.url;
                } else {
                    alert('Erreur: ' + (json.error || 'Inconnue'));
                    setLoading(false);
                }
            };
        } catch (error: any) {
            alert('Erreur: ' + error.message);
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <FileText className="text-blue-600" />
                        Ajuster les zones de signature
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Preview Area */}
                    <div className="flex-1 bg-gray-100 p-8 overflow-y-auto flex justify-center">
                        <div
                            ref={pageRef}
                            className="relative bg-white shadow-2xl transition-all"
                            style={{
                                width: '100%',
                                maxWidth: '700px', // Approx A4 width on screen
                                aspectRatio: '210/297',
                            }}
                        >
                            {/* PDF Background (Using Object or Image? generating image from PDF client side is hard.
                               Simplest: Just show white box with grid. User knows context.
                               Better: Show actual PDF via iframe underneath?
                               Actually, iframe swallows mouse events.
                               Best Compromise: Just show the box and maybe outlines.
                               For this MVP, we just show the box (The layout doesn't change much).
                               WAIT! User wants to see it ON the PDF.
                               I can try to put the PDF object in background, but capturing clicks is tricky.
                               I will put a div overlay on top of an iframe/object.
                            */}
                            {previewPdfUrl && (
                                <embed
                                    src={`${previewPdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                                    type="application/pdf"
                                    className="absolute inset-0 w-full h-full border-none pointer-events-none opacity-60"
                                />
                            )}

                            {/* Fallback Grid/Guide if PDF issues */}
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
                                    backgroundSize: '10% 10%',
                                }}
                            />

                            {/* Interchangeable overlays */}
                            <div className="absolute inset-0 z-10">
                                {fields.map((field, index) => (
                                    <div
                                        key={index}
                                        className={`absolute ${field.color} bg-opacity-40 border-2 ${field.color.replace('bg-', 'border-')} cursor-move group hover:bg-opacity-60 transition-colors shadow-sm`}
                                        style={{
                                            left: `${field.x * 100}%`,
                                            top: `${field.y * 100}%`,
                                            width: `${field.w * 100}%`,
                                            height: `${field.h * 100}%`,
                                        }}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setDragging({
                                                index,
                                                startX: (e.clientX - pageRef.current!.getBoundingClientRect().left) / pageRef.current!.getBoundingClientRect().width,
                                                startY: (e.clientY - pageRef.current!.getBoundingClientRect().top) / pageRef.current!.getBoundingClientRect().height,
                                                startFieldX: field.x,
                                                startFieldY: field.y
                                            });
                                        }}
                                    >
                                        <div className="text-[10px] font-bold p-1 text-gray-900 bg-white/50 inline-block rounded m-1 pointer-events-none">{field.name}</div>

                                        {/* Resize Handle */}
                                        <div
                                            className="absolute bottom-0 right-0 w-6 h-6 bg-white border border-gray-400 cursor-se-resize flex items-center justify-center hover:bg-gray-100 z-20"
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                setResizing({
                                                    index,
                                                    startX: (e.clientX - pageRef.current!.getBoundingClientRect().left) / pageRef.current!.getBoundingClientRect().width,
                                                    startY: (e.clientY - pageRef.current!.getBoundingClientRect().top) / pageRef.current!.getBoundingClientRect().height,
                                                    startFieldW: field.w,
                                                    startFieldH: field.h
                                                });
                                            }}
                                        >
                                            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="w-80 bg-white border-l p-6 flex flex-col shadow-xl z-20">
                        <h3 className="font-bold text-lg mb-4">Actions</h3>

                        <p className="text-sm text-gray-500 mb-8">
                            Ajustez les cadres sur l'aperçu à gauche pour qu'ils s'alignent parfaitement avec votre document.
                        </p>

                        <div className="space-y-4 mt-auto">
                            <button
                                onClick={() => handleSign()} // Signer Directly
                                disabled={loading}
                                className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-black transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                            >
                                {loading ? <span className="animate-spin">...</span> : <FileText />}
                                Signer Maintenant
                            </button>

                            {/* Option pour envoyer par email plus tard si besoin */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
