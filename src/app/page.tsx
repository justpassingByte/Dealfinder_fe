import type { Metadata } from 'next';
import HomePageClient, { HotDeal } from './HomePageClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'SmartDeal - Tìm Sản Phẩm Tốt Nhất, Cập Nhật Giá Theo Thời Gian Thực',
  description: 'SmartDeal - Công cụ so sánh giá, tìm kiếm sản phẩm bán chạy và giá hời từ Shopee, Lazada. Phân tích giá và sự kiện giảm giá chuẩn xác.',
  keywords: 'smartdeal, tìm giá tốt nhất, săn sale, shopee, lazada, so sánh giá',
  openGraph: {
    title: 'SmartDeal - Tìm Nhanh Chóng Giá Tốt Nhất Tại Việt Nam',
    description: 'Khám phá deal khủng, lịch sử giá và so sánh giá giữa nhiều gian hàng với SmartDeal.',
    url: 'https://smartdeal.vn',
    siteName: 'SmartDeal',
    images: [
      {
        url: '/SDLogo2.png',
        width: 1200,
        height: 630,
        alt: 'SmartDeal Logo',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
  metadataBase: new URL('http://localhost:3000'),
};

const getApiUrl = () => {
  // SSR (Server Side Rendering) context
  const url = process.env.NEXT_PUBLIC_INTERNAL_API_URL || process.env.DESTINATION_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  return url.replace(/\/api\/?$/, "").replace(/\/$/, "");
};

async function getInitialDeals(): Promise<HotDeal[]> {
  try {
    // Disable caching for Hot Deals to ensure fresh data
    const res = await fetch(`${getApiUrl()}/api/deals/hot`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.deals || [];
  } catch (error) {
    console.error("Failed to fetch initial deals server-side:", error);
    return [];
  }
}

async function getInitialTrends(): Promise<string[]> {
  try {
    // Disable caching for trends
    const res = await fetch(`${getApiUrl()}/api/trends?limit=8`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.trends && data.trends.length > 0) return data.trends;
    return ['nồi cơm điện', 'tai nghe bluetooth', 'giày sneaker nam', 'sạc dự phòng', 'bình giữ nhiệt'];
  } catch (error) {
    console.error("Failed to fetch initial trends server-side:", error);
    return ['nồi cơm điện', 'tai nghe bluetooth', 'giày sneaker nam', 'sạc dự phòng', 'bình giữ nhiệt'];
  }
}

export default async function Page() {
  // Fetch initial data simultaneously
  const [hotDeals, trends] = await Promise.all([
    getInitialDeals(),
    getInitialTrends(),
  ]);

  return <HomePageClient initialHotDeals={hotDeals} initialTrends={trends} />;
}
