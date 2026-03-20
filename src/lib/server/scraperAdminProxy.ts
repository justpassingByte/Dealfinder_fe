import 'server-only';

function resolveBackendBaseUrl(): string {
    const candidates = [
        process.env.INTERNAL_API_URL,
        process.env.NEXT_PUBLIC_INTERNAL_API_URL,
        process.env.NEXT_PUBLIC_API_URL,
    ].filter(Boolean) as string[];

    const fallback = process.env.NODE_ENV === 'development' ? 'http://localhost:4000' : '';
    const base = candidates[0] || fallback;
    return base.replace(/\/api\/?$/, '').replace(/\/$/, '');
}

export async function proxyScraperAdminRequest(request: Request, path = ''): Promise<Response> {
    const adminSecret = process.env.SCRAPER_ADMIN_SECRET;

    const backendBaseUrl = resolveBackendBaseUrl();
    if (!backendBaseUrl) {
        return Response.json(
            { error: 'Backend API URL is not configured for scraper admin proxying.' },
            { status: 503 },
        );
    }

    const targetUrl = `${backendBaseUrl}/api/admin/scraper${path}`;
    const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (adminSecret) {
        headers['x-admin-secret'] = adminSecret;
    }

    const response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body,
        cache: 'no-store',
    });

    const contentType = response.headers.get('content-type') || 'application/json';
    return new Response(response.body, {
        status: response.status,
        headers: {
            'content-type': contentType,
        },
    });
}
