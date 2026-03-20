import { proxyScraperAdminRequest } from '@/lib/server/scraperAdminProxy';

function toBackendPath(params: { id: string; path?: string[] }): string {
    const suffix = (params.path ?? []).join('/');
    return suffix ? `/profiles/${params.id}/${suffix}` : `/profiles/${params.id}`;
}

export async function GET(request: Request, context: { params: Promise<{ id: string; path?: string[] }> }): Promise<Response> {
    const params = await context.params;
    return proxyScraperAdminRequest(request, toBackendPath(params));
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string; path?: string[] }> }): Promise<Response> {
    const params = await context.params;
    return proxyScraperAdminRequest(request, toBackendPath(params));
}

export async function POST(request: Request, context: { params: Promise<{ id: string; path?: string[] }> }): Promise<Response> {
    const params = await context.params;
    return proxyScraperAdminRequest(request, toBackendPath(params));
}
