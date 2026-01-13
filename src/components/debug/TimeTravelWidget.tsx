'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, X } from 'lucide-react';

export default function TimeTravelWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [date, setDate] = useState('');
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        // Check for existing cookie
        const match = document.cookie.match(new RegExp('(^| )NEXT_DEBUG_DATE=([^;]+)'));
        if (match) {
            setDate(match[2]);
            setIsActive(true);
        } else {
            setDate(new Date().toISOString().split('T')[0]);
        }
    }, []);

    const handleApply = () => {
        if (!date) return;
        document.cookie = `NEXT_DEBUG_DATE=${date}; path=/; max-age=31536000`; // 1 year
        setIsActive(true);
        window.location.reload();
    };

    const handleReset = () => {
        document.cookie = 'NEXT_DEBUG_DATE=; path=/; max-age=0';
        setIsActive(false);
        setDate(new Date().toISOString().split('T')[0]);
        window.location.reload();
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-4 right-4 p-3 rounded-full shadow-lg z-50 transition-all ${isActive ? 'bg-purple-600 text-white animate-pulse' : 'bg-gray-800 text-gray-400 opacity-50 hover:opacity-100'
                    }`}
                title="Time Travel Debugger"
            >
                <Clock size={24} />
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded-xl shadow-2xl z-50 border border-purple-200 w-80">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Clock size={16} className="text-purple-600" />
                    Time Travel
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                </button>
            </div>

            <div className="space-y-3">
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    Simule une date future pour tester la facturation et les proratas.
                </div>

                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />

                <div className="flex gap-2">
                    <button
                        onClick={handleReset}
                        disabled={!isActive}
                        className="flex-1 py-2 px-4 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
                    >
                        Reset
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 shadow-md"
                    >
                        Appliquer
                    </button>
                </div>

                {isActive && (
                    <div className="text-center text-xs text-purple-600 font-bold animate-pulse">
                        ⚠️ DATE FICTIVE ACTIVÉE
                    </div>
                )}
            </div>
        </div>
    );
}
