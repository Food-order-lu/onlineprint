
'use client';

import { useState, useRef, useEffect } from 'react';
import { Save, RefreshCw } from 'lucide-react';

interface FieldConfig {
    name: string;
    key: string;
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
}

export default function DocuSealConfigPage() {
    // Default values matching src/lib/docuseal.ts
    const initialFields: FieldConfig[] = [
        { name: 'Mention (Bon pour accord)', key: 'MENTION', x: 0.05, y: 0.78, w: 0.40, h: 0.03, color: 'bg-blue-500' },
        { name: 'Date', key: 'DATE', x: 0.55, y: 0.78, w: 0.25, h: 0.03, color: 'bg-green-500' },
        { name: 'Signature Client', key: 'SIGNATURE', x: 0.05, y: 0.84, w: 0.45, h: 0.06, color: 'bg-purple-500' },
    ];

    const [fields, setFields] = useState<FieldConfig[]>(initialFields);
    const [dragging, setDragging] = useState<{ index: number, startX: number, startY: number, startFieldX: number, startFieldY: number } | null>(null);
    const [resizing, setResizing] = useState<{ index: number, startX: number, startY: number, startFieldW: number, startFieldH: number } | null>(null);

    const pageRef = useRef<HTMLDivElement>(null);

    // Mouse Move Handler
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

    const handleCopyEnv = () => {
        const envLines = fields.map(f => [
            `DOCUSEAL_${f.key}_X=${f.x.toFixed(3)}`,
            `DOCUSEAL_${f.key}_Y=${f.y.toFixed(3)}`,
            `DOCUSEAL_${f.key}_W=${f.w.toFixed(3)}`,
            `DOCUSEAL_${f.key}_H=${f.h.toFixed(3)}`
        ].join('\n')).join('\n');

        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(envLines)
                .then(() => alert('Configuration copiée dans le presse-papier ! À coller dans .env.local'))
                .catch((err) => {
                    console.error('Async clipboard failed', err);
                    fallbackCopyArgs(envLines);
                });
        } else {
            fallbackCopyArgs(envLines);
        }
    };

    const fallbackCopyArgs = (text: string) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed"; // Avoid scrolling to bottom
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            alert('Configuration copiée !');
        } catch (err) {
            alert('Impossible de copier. Voici les valeurs :\n\n' + text);
        }
        document.body.removeChild(textArea);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-6xl mx-auto flex gap-8">
                {/* Visual Editor (A4 Paper) */}
                <div className="flex-1">
                    <div className="bg-white shadow-lg rounded-lg p-1 mb-4 flex justify-between items-center">
                        <h1 className="font-bold px-4">Configurateur Signature DocuSeal</h1>
                        <div className="text-xs text-gray-500 px-4">A4 Ratio (210x297mm)</div>
                    </div>

                    <div
                        ref={pageRef}
                        className="relative bg-white shadow-2xl mx-auto overflow-hidden select-none border border-gray-300"
                        style={{
                            width: '100%',
                            aspectRatio: '210/297',
                            backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
                            backgroundSize: '10% 10%',
                            backgroundPosition: '0 0'
                        }}
                    >
                        {/* Footer Simulation */}
                        <div className="absolute bottom-0 w-full h-[15%] border-t border-dashed border-gray-300 pointer-events-none p-4">
                            <p className="text-gray-300 text-center text-sm">Zone de bas de page (Simulation)</p>
                        </div>

                        {/* Fields */}
                        {fields.map((field, index) => (
                            <div
                                key={index}
                                className={`absolute ${field.color} bg-opacity-30 border-2 ${field.color.replace('bg-', 'border-')} cursor-move group hover:bg-opacity-50 transition-colors`}
                                style={{
                                    left: `${field.x * 100}%`,
                                    top: `${field.y * 100}%`,
                                    width: `${field.w * 100}%`,
                                    height: `${field.h * 100}%`,
                                }}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    setDragging({
                                        index,
                                        startX: (e.clientX - pageRef.current!.getBoundingClientRect().left) / pageRef.current!.getBoundingClientRect().width,
                                        startY: (e.clientY - pageRef.current!.getBoundingClientRect().top) / pageRef.current!.getBoundingClientRect().height,
                                        startFieldX: field.x,
                                        startFieldY: field.y
                                    });
                                }}
                            >
                                <div className="text-[10px] font-bold p-1 text-gray-800 truncate">{field.name}</div>
                                <div className="text-[8px] p-1 text-gray-600">x:{field.x.toFixed(2)} y:{field.y.toFixed(2)}</div>

                                {/* Resize Handle */}
                                <div
                                    className="absolute bottom-0 right-0 w-4 h-4 bg-white border border-gray-400 cursor-se-resize flex items-center justify-center"
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
                                    <div className="w-1 h-1 bg-gray-400 rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Controls */}
                <div className="w-80 space-y-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="font-bold mb-4">Coordonnées</h2>
                        <div className="space-y-4">
                            {fields.map((field, idx) => (
                                <div key={idx} className="border-b pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`w-3 h-3 rounded-full ${field.color}`} />
                                        <span className="font-semibold text-sm">{field.name}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <label className="text-gray-500">X</label>
                                            <input
                                                type="number" step="0.01"
                                                value={field.x.toFixed(2)}
                                                onChange={e => {
                                                    const newFields = [...fields];
                                                    newFields[idx].x = parseFloat(e.target.value);
                                                    setFields(newFields);
                                                }}
                                                className="w-full p-1 border rounded"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-gray-500">Y</label>
                                            <input
                                                type="number" step="0.01"
                                                value={field.y.toFixed(2)}
                                                onChange={e => {
                                                    const newFields = [...fields];
                                                    newFields[idx].y = parseFloat(e.target.value);
                                                    setFields(newFields);
                                                }}
                                                className="w-full p-1 border rounded"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-gray-500">W</label>
                                            <input
                                                type="number" step="0.01"
                                                value={field.w.toFixed(2)}
                                                onChange={e => {
                                                    const newFields = [...fields];
                                                    newFields[idx].w = parseFloat(e.target.value);
                                                    setFields(newFields);
                                                }}
                                                className="w-full p-1 border rounded"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-gray-500">H</label>
                                            <input
                                                type="number" step="0.01"
                                                value={field.h.toFixed(2)}
                                                onChange={e => {
                                                    const newFields = [...fields];
                                                    newFields[idx].h = parseFloat(e.target.value);
                                                    setFields(newFields);
                                                }}
                                                className="w-full p-1 border rounded"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                        <button
                            onClick={handleCopyEnv}
                            className="w-full py-2 bg-gray-900 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors"
                        >
                            <Save size={18} />
                            Copier Config (.env)
                        </button>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            Copiez ces valeurs dans votre fichier .env pour les appliquer par défaut.
                        </p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-xs text-blue-800">
                        <p>
                            <strong>Note :</strong> Ces positions sont relatives (0 à 1) par rapport à la taille de la page PDF.
                            L'axe Y=0 est le haut de la page, Y=1 le bas.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
