import { proxyScraperAdminRequest } from '@/lib/server/scraperAdminProxy';

export async function GET(request: Request): Promise<Response> {
    return proxyScraperAdminRequest(request, '/profiles/summary');
}
