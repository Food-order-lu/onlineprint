'use client';

import { useRef, useEffect, useState } from 'react';
import { Trash2, Check, RotateCcw } from 'lucide-react';

interface SignaturePadProps {
    onSignatureChange: (signature: string | null) => void;
    width?: number;
    height?: number;
    label?: string;
}

export default function SignaturePad({
    onSignatureChange,
    width = 500,
    height = 200,
    label = "Signature"
}: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set up canvas
        ctx.strokeStyle = '#1A3A5C';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Fill with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        if ('touches' in e) {
            const touch = e.touches[0];
            return {
                x: (touch.clientX - rect.left) * scaleX,
                y: (touch.clientY - rect.top) * scaleY,
            };
        }

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        const { x, y } = getCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        e.preventDefault();

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        const { x, y } = getCoordinates(e);
        ctx.lineTo(x, y);
        ctx.stroke();
        setHasSignature(true);
    };

    const stopDrawing = () => {
        if (isDrawing && hasSignature) {
            const canvas = canvasRef.current;
            if (canvas) {
                const signature = canvas.toDataURL('image/png');
                onSignatureChange(signature);
            }
        }
        setIsDrawing(false);
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
        onSignatureChange(null);
    };

    const handleConfirm = () => {
        if (hasSignature) {
            const canvas = canvasRef.current;
            if (canvas) {
                const signature = canvas.toDataURL('image/png');
                onSignatureChange(signature);
            }
        }
    };

    return (
        <div className="space-y-4">
            <label className="label">{label}</label>

            <div className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white">
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    className="w-full touch-none cursor-crosshair"
                    style={{ maxWidth: '100%', height: 'auto', aspectRatio: `${width}/${height}` }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />

                {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-gray-400 text-sm">Signez ici (souris ou tactile)</p>
                    </div>
                )}
            </div>

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={clearSignature}
                    className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 flex-1"
                    disabled={!hasSignature}
                >
                    <Trash2 size={18} />
                    Effacer
                </button>

                <button
                    type="button"
                    onClick={clearSignature}
                    className="btn bg-gray-100 hover:bg-gray-200 text-gray-700"
                    disabled={!hasSignature}
                >
                    <RotateCcw size={18} />
                </button>

                {hasSignature && (
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="btn btn-primary flex-1"
                    >
                        <Check size={18} />
                        Confirmer
                    </button>
                )}
            </div>

            {hasSignature && (
                <p className="text-sm text-green-600 flex items-center gap-2">
                    <Check size={16} />
                    Signature enregistrée
                </p>
            )}
        </div>
    );
}
