
import { cookies } from 'next/headers';

/**
 * Returns the current date, respecting the NEXT_DEBUG_DATE cookie if present.
 * This should be used instead of new Date() for all logic that depends on "now".
 */
export async function getCurrentDate(): Promise<Date> {
    // In Server Components/Actions, we can access cookies
    try {
        const cookieStore = await cookies();
        const debugDate = cookieStore.get('NEXT_DEBUG_DATE');
        if (debugDate?.value) {
            console.log(`[DEBUG] Time Travel Active: Using ${debugDate.value} instead of now.`);
            return new Date(debugDate.value);
        }
    } catch (e) {
        // Fallback or client-side check
    }
    return new Date();
}

/**
 * Returns the current date as ISO string (YYYY-MM-DD)
 */
export async function getCurrentDateISO(): Promise<string> {
    const date = await getCurrentDate();
    return date.toISOString().split('T')[0];
}
