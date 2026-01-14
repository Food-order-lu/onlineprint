// Middleware for route protection
// Separates admin and client access

import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Routes that require admin authentication
const ADMIN_ROUTES = ['/admin'];

// Routes that require client authentication
const CLIENT_ROUTES = ['/client'];

// Public routes (no auth required)
const PUBLIC_ROUTES = [
    '/',
    '/login',
    '/admin/login',
    '/quote',
    '/cancel',
    '/api/gocardless/webhook',
    '/api/cancel',
    '/api/public',
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public routes
    if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Allow static files and API routes (except protected ones)
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // Check for admin routes
    if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
        const adminToken = request.cookies.get('admin_token')?.value;

        if (!adminToken) {
            // Redirect to admin login
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }

        try {
            // Verify admin token
            const secret = new TextEncoder().encode(JWT_SECRET);
            const { payload } = await jose.jwtVerify(adminToken, secret);

            if (payload.role !== 'admin') {
                throw new Error('Not an admin');
            }

            // Token is valid, continue
            return NextResponse.next();
        } catch {
            // Invalid token, redirect to login
            const response = NextResponse.redirect(new URL('/admin/login', request.url));
            response.cookies.delete('admin_token');
            return response;
        }
    }

    // Check for client routes
    if (CLIENT_ROUTES.some(route => pathname.startsWith(route))) {
        const clientToken = request.cookies.get('client_token')?.value;

        if (!clientToken) {
            // Redirect to client login
            return NextResponse.redirect(new URL('/login', request.url));
        }

        try {
            // Verify client token
            const secret = new TextEncoder().encode(JWT_SECRET);
            const { payload } = await jose.jwtVerify(clientToken, secret);

            if (payload.role !== 'client') {
                throw new Error('Not a client');
            }

            // Add client_id to request headers for API routes
            const requestHeaders = new Headers(request.headers);
            requestHeaders.set('x-client-id', payload.client_id as string);

            return NextResponse.next({
                request: {
                    headers: requestHeaders,
                },
            });
        } catch {
            // Invalid token, redirect to login
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('client_token');
            return response;
        }
    }

    // API routes protection
    if (pathname.startsWith('/api/admin') || pathname.startsWith('/api/clients')) {
        const adminToken = request.cookies.get('admin_token')?.value;

        if (!adminToken) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        try {
            const secret = new TextEncoder().encode(JWT_SECRET);
            await jose.jwtVerify(adminToken, secret);
            return NextResponse.next();
        } catch {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            );
        }
    }

    // Default: allow
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
