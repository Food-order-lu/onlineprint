import SignQuoteClient from './SignQuoteClient';

// Generate static params for static export
export function generateStaticParams() {
    return [
        { id: 'demo' },
        { id: 'DEV-202412-001' },
    ];
}

export default function SignQuotePage() {
    return <SignQuoteClient />;
}
