'use client';

import dynamic from 'next/dynamic';

const TimeTravelWidget = dynamic(() => import('./TimeTravelWidget'), { ssr: false });

export default function TimeTravelWrapper() {
    // We can add condition here to only show in development or if a secret query param is present
    // For now, we show it always as requested for testing.
    return <TimeTravelWidget />;
}
