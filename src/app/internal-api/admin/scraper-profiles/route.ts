import { proxyScraperAdminRequest } from '@/lib/server/scraperAdminProxy';

export async function GET(request: Request): Promise<Response> {
    return proxyScraperAdminRequest(request, '/profiles');
}

export async function POST(request: Request): Promise<Response> {
    return proxyScraperAdminRequest(request, '/profiles');
}
