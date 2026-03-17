"use client";

import { useState, FormEvent, useCallback, useEffect } from "react";
import Image from "next/image";
import { Search, Zap, Check, ExternalLink, TrendingDown, Star, ShoppingCart, Info, TrendingUp, Download, Chrome, LayoutGrid, Filter, Flame, Share2, Copy } from "lucide-react";
import Footer from "./components/Footer";

export interface Listing {
  id: string;
  title: string;
  price: number;
  url: string;
  image?: string;
  shop: string;
  marketplace: string;
  rating: number;
  sold: number;
  score?: number;
  relevanceScore?: number;
  // Deal intelligence fields
  listingId?: string;
  isDeal?: boolean;
  discountPercent?: number;
  medianPrice?: number;
  lowestPrice?: number;
}

interface ComparisonResult {
  bestDeal: Listing;
  sellerList: Listing[];
}

interface DealAlert {
  listing: Listing;
  priceZScore: number;
  anomalyType: "great_deal" | "overpriced" | "normal";
  savingsPercent: number;
}

interface DealDetectionResult {
  meanPrice: number;
  stdDev: number;
  alerts: DealAlert[];
}

interface PriceHistoryEntry {
  price: number;
  recordedAt: string;
}

const getApiUrl = () => {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || `http://${window.location.hostname}:4000`;
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
};

const API = getApiUrl();
console.log("[FrontEnd] API URL:", API);

// Regex to detect marketplace URLs
const MARKETPLACE_URL_REGEX = /^https?:\/\/(www\.)?(shopee|lazada)\./i;

export interface HotDeal {
  listingId: string;
  itemId: string;
  productName: string;
  storage: string | null;
  color: string | null;
  price: number;
  discountPercent: number;
  imageUrl: string | null;
  shopName: string;
  rating: number;
  sold: number;
  marketplace: string;
}

function formatPrice(price: number): string {
  return price.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });
}

function formatSold(sold: number): string {
  if (sold >= 1000) {
    return (sold / 1000).toFixed(1).replace(/\.0$/, "").replace(".", ",") + "k+";
  }
  return sold.toString();
}

export default function HomePage({ initialHotDeals = [], initialTrends = [] }: { initialHotDeals?: HotDeal[], initialTrends?: string[] }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // Results State
  const [hasSearched, setHasSearched] = useState(false);
  const [searchStatus, setSearchStatus] = useState("");
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [dealDetection, setDealDetection] = useState<DealDetectionResult | null>(null);

  // Price History State
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([]);

  // Sort State
  const [sortBy, setSortBy] = useState<"price" | "sold">("price");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [hotDeals, setHotDeals] = useState<HotDeal[]>(initialHotDeals);
  const [loadingHotDeals, setLoadingHotDeals] = useState(false);
  const [trends, setTrends] = useState<string[]>(initialTrends);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [focusedInput, setFocusedInput] = useState<"header" | "main" | null>(null);

  useEffect(() => {
    if (!url.trim() || MARKETPLACE_URL_REGEX.test(url)) {
      setSuggestions([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/api/search/autocomplete?q=${encodeURIComponent(url)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (err) {
        // ignore
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [url]);

  const toggleSort = (col: "price" | "sold") => {
    if (sortBy === col) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortOrder(col === "price" ? "asc" : "desc"); // Giá mặc định tăng dần (rẻ nhất), Đã bán mặc định giảm dần (nhiều nhất)
    }
  };

  const [catalogProduct, setCatalogProduct] = useState<any>(null);
  const [dataSource, setDataSource] = useState<string>("");

  const fetchResults = useCallback(async (q: string) => {
    try {
      setSearchStatus("Đang truy xuất từ danh mục sản phẩm...");
      // 1. Search (using catalog-powered endpoint)
      const searchRes = await fetch(`${API}/api/search/catalog?q=${encodeURIComponent(q)}`);

      if (searchRes.status === 202) {
        setTimeout(() => fetchResults(q), 2000);
        return;
      }

      if (!searchRes.ok) {
        const data = await searchRes.json();
        alert(data.error || "Tìm kiếm thất bại.");
        setLoading(false);
        setSearchStatus("");
        return;
      }

      const searchData = await searchRes.json();
      const listings: Listing[] = searchData.listings || [];

      // Save catalog-specific metadata
      setCatalogProduct(searchData.product);
      setDataSource(searchData.source);

      if (listings.length === 0) {
        alert("Không tìm thấy kết quả nào cho sản phẩm này.");
        setLoading(false);
        setSearchStatus("");
        return;
      }

      setSearchStatus("Đang so sánh người bán & áp dụng phân tích AI...");
      // 2. Compare
      const compareRes = await fetch(
        `${API}/api/compare?listings=${encodeURIComponent(JSON.stringify(listings))}`
      );
      if (!compareRes.ok) {
        alert("So sánh thất bại.");
        setLoading(false);
        setSearchStatus("");
        return;
      }

      const compareData: ComparisonResult = await compareRes.json();
      setResult(compareData);

      // 3. AI: Deal Detection (fire-and-forget)
      try {
        const aiRes = await fetch(`${API}/api/ai/detect-deals`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listings }),
        });
        if (aiRes.ok) {
          const aiData: DealDetectionResult = await aiRes.json();
          setDealDetection(aiData);
        }
      } catch (e) {
        // AI features are optional
      }

      setLoading(false);
      setSearchStatus("");
      setHasSearched(true);
    } catch {
      alert("Network error. Ensure the API is running.");
      setLoading(false);
      setSearchStatus("");
    }
  }, []);

  async function handleSubmit(e: FormEvent, explicitUrl?: string) {
    e.preventDefault();
    const targetUrl = explicitUrl || url;
    if (!targetUrl.trim()) return;
    setUrl(targetUrl.trim());
    setLoading(true);
    setHasSearched(false);
    setResult(null);
    setDealDetection(null);
    setPriceHistory([]);

    const input = targetUrl.trim();
    const isUrl = MARKETPLACE_URL_REGEX.test(input);

    if (isUrl) {
      // URL flow: analyze first, then search with extracted title
      setSearchStatus("Đang phân tích URL sản phẩm...");
      try {
        const res = await fetch(`${API}/api/analyze-product`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: input }),
        });
        const data = await res.json();

        if (!res.ok) {
          alert(data.error || "Phân tích sản phẩm thất bại.");
          setLoading(false);
          setSearchStatus("");
          return;
        }

        await fetchResults(data.query);
      } catch {
        alert("Network error. Make sure the API server is running.");
        setLoading(false);
        setSearchStatus("");
      }
    } else {
      // Keyword flow: send directly to catalog search (URL detection is also done server-side)
      await fetchResults(input);
    }
  }

  const redirectUrl = (listing: Listing) => {
    if (listing.listingId) {
      return `${API}/api/redirect/${listing.listingId}`;
    }
    return `${API}/api/redirect?url=${encodeURIComponent(listing.url)}`;
  };

  // Fetch price history when results are ready
  useEffect(() => {
    if (result?.bestDeal?.listingId) {
      fetch(`${API}/api/listings/${result.bestDeal.listingId}/price-history`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.history) setPriceHistory(data.history);
        })
        .catch(() => { });
    }
  }, [result?.bestDeal?.listingId]);

  const handleShare = (listing: Listing) => {
    if (!listing.listingId) return;
    const dealUrl = `${window.location.origin.replace(':3000', ':4000')}/api/deal/${listing.listingId}`;
    navigator.clipboard.writeText(dealUrl);
    alert("Đã sao chép liên kết deal! Bạn có thể chia sẻ cho bạn bè.");
  };

  const fetchHotDeals = useCallback(async () => {
    setLoadingHotDeals(true);
    try {
      const res = await fetch(`${API}/api/deals/hot`);
      if (res.ok) {
        const data = await res.json();
        setHotDeals(data.deals || []);
      }
    } catch (err) {
      console.error("Failed to fetch hot deals:", err);
    } finally {
      setLoadingHotDeals(false);
    }
  }, []);

  const fetchTrends = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/trends?limit=8`);
      if (res.ok) {
        const data = await res.json();
        if (data.trends && data.trends.length > 0) {
          setTrends(data.trends);
        } else {
          // Fallback if DB is empty
          setTrends(['nồi cơm điện', 'tai nghe bluetooth', 'giày sneaker nam', 'sạc dự phòng', 'bình giữ nhiệt']);
        }
      }
    } catch (err) {
      console.error("Failed to fetch trends:", err);
    }
  }, []);

  useEffect(() => {
    if (hotDeals.length === 0) fetchHotDeals();
    if (trends.length === 0) fetchTrends();
  }, [fetchHotDeals, fetchTrends, hotDeals.length, trends.length]);

  return (
    <div className={`flex flex-col bg-[#F3F4F6] text-slate-900 font-sans selection:bg-teal-100 min-h-screen`}>
      {/* Navbar - Restyled exactly like layout */}
      <header className="sticky top-0 z-50 bg-[#F3F4F6] border-b border-slate-200 h-[120px] flex flex-col justify-center shrink-0">
        <div className="w-full max-w-7xl mx-auto px-6 flex items-center justify-between h-full">
          <div
            className="flex items-center gap-2 cursor-pointer relative h-full py-4"
            onClick={() => {
              setHasSearched(false);
              setUrl("");
            }}
          >
            <Image
              src="/SDLogo2.png"
              alt="SmartDeal"
              width={340}
              height={185}
              className="h-24 md:h-28 w-auto object-contain"
              priority
            />
          </div>

          <div className="flex-1 max-w-lg mx-6 hidden md:block">
            <form
              onSubmit={(e) => {
                const input = e.currentTarget.querySelector("input") as HTMLInputElement;
                handleSubmit(e, input.value);
              }}
              className="relative"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm sản phẩm (tên hoặc link)..."
                className="w-full pl-9 pr-4 py-1.5 bg-[#e2e8f0] border-none rounded-md text-sm focus:ring-2 focus:ring-[#0f172a] outline-none placeholder:text-slate-500"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onFocus={() => setFocusedInput("header")}
                onBlur={() => setTimeout(() => setFocusedInput(null), 200)}
              />
              {focusedInput === "header" && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-[100] animate-in slide-in-from-top-2">
                  {suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-3 hover:bg-teal-50 flex items-center gap-3 cursor-pointer border-b border-slate-50 last:border-0"
                      onClick={() => {
                        setUrl(suggestion);
                        handleSubmit({ preventDefault: () => { } } as any, suggestion);
                        setFocusedInput(null);
                      }}
                    >
                      <Search className="w-3 h-3 text-slate-400" />
                      <span className="text-sm text-slate-700 font-medium text-left">{suggestion}</span>
                    </div>
                  ))}
                </div>
              )}
            </form>
          </div>

          <div className="flex items-center gap-4">
            {/* Auth buttons removed */}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col">
        <section className={`transition-all duration-700 ${hasSearched ? "py-10" : "flex-1 flex flex-col items-center justify-center py-20"}`}>
          <div className="w-full max-w-4xl mx-auto px-6 text-center">
            {!hasSearched && (
              <div className="mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-4 py-2 rounded-full text-xs font-bold mb-6 tracking-wide shadow-sm border border-teal-100">
                  <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-pulse"></span>
                  CẬP NHẬT GIÁ THEO THỜI GIAN THỰC
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight leading-[1.1]">
                  Tìm Sản Phẩm <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-teal-400">Tốt Nhất</span> <br />
                  Tiết Kiệm Nhất
                </h1>
                <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                  Dán link hoặc nhập tên sản phẩm để chúng tôi giúp bạn lọc ra những lựa chọn chất lượng nhất với giá hời nhất từ các shop uy tín.
                </p>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className={`relative bg-white p-2 rounded-3xl shadow-[0_20px_70px_-10px_rgba(0,0,0,0.1)] transition-all duration-500 ${hasSearched ? "scale-95" : "scale-100"}`}
            >
              <div className="relative flex items-center">
                <div className="absolute left-6 text-slate-400">
                  <Search className="w-6 h-6" />
                </div>
                <input
                  type="text"
                  placeholder="Dán link sản phẩm hoặc nhập tên sản phẩm..."
                  className="w-full pl-16 pr-6 py-6 bg-transparent text-xl font-medium outline-none placeholder:text-slate-300 transition-all text-slate-800"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onFocus={() => setFocusedInput("main")}
                  onBlur={() => setTimeout(() => setFocusedInput(null), 200)}
                  disabled={loading}
                  required
                />
              </div>

              {focusedInput === "main" && suggestions.length > 0 && (
                <div className="absolute top-[80px] left-0 right-0 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in slide-in-from-top-2 text-left">
                  {suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="px-6 py-4 hover:bg-teal-50 flex items-center gap-3 cursor-pointer border-b border-slate-50 last:border-0"
                      onClick={() => {
                        setUrl(suggestion);
                        handleSubmit({ preventDefault: () => { } } as any, suggestion);
                        setFocusedInput(null);
                      }}
                    >
                      <Search className="w-5 h-5 text-slate-400" />
                      <span className="text-lg text-slate-700 font-medium">{suggestion}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-8 flex flex-col items-center gap-4">
                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="min-w-[240px] bg-[#0f172a] hover:bg-teal-600 text-white py-3.5 px-10 rounded-xl flex items-center justify-center gap-3 text-base font-bold transition-all hover:shadow-xl active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg group"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="text-sm">{searchStatus || "Đang xử lý..."}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-white" />
                      Tìm Giá Tốt Nhất
                    </>
                  )}
                </button>

                <div className="flex items-center gap-6 text-[11px] text-slate-400 font-medium uppercase tracking-widest animate-fade-in">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-teal-500" /> MIỄN PHÍ
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-teal-500" /> CHÍNH XÁC
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-teal-500" /> BẢO MẬT
                  </div>
                </div>
              </div>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-8 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-teal-500" />
                Được tin dùng bởi 50k+ người
              </div>
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-300"></span>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-teal-500" />
                Lịch sử giá 30 ngày
              </div>
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-300"></span>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-teal-500" />
                Đánh giá người bán thật
              </div>
            </div>
          </div>
        </section>

        {/* --- HOT DEALS SECTION --- */}
        {!hasSearched && (
          <div className="w-full max-w-7xl mx-auto px-6 mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-[#0f172a] flex items-center gap-2">
                <Flame className="w-6 h-6 text-orange-500 fill-orange-500" /> Deal Hot Trong Ngày
              </h2>
              <button
                onClick={() => fetchHotDeals()}
                className="text-xs font-black text-teal-600 hover:text-teal-700 uppercase tracking-widest flex items-center gap-2"
              >
                Làm mới <Zap className="w-3 h-3" />
              </button>
            </div>

            {loadingHotDeals && hotDeals.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-pulse h-[200px]"></div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {hotDeals.map((deal) => (
                    <a
                      key={deal.listingId}
                      href={`${API}/api/deal/${deal.listingId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative bg-white border border-slate-200 hover:border-teal-500 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all active:scale-[0.98] flex gap-5 overflow-hidden"
                    >
                      {/* Decorative background element for premium feel */}
                      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-slate-50 rounded-full group-hover:bg-teal-50/50 transition-colors duration-500" />

                      <div className="w-28 h-28 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500 relative z-10">
                        {deal.imageUrl ? (
                          <Image src={deal.imageUrl} alt={deal.productName} fill className="object-contain p-2" />
                        ) : (
                          <Zap className="w-8 h-8 text-slate-200" />
                        )}
                        <div className="absolute top-1.5 left-1.5 bg-[#0f172a]/80 backdrop-blur-sm text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter z-20">
                          {deal.marketplace}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between relative z-10">
                        <div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {deal.sold > 500 && (
                              <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase border border-amber-200">Bán chạy</span>
                            )}
                            {deal.rating >= 4.8 && (
                              <span className="bg-teal-100 text-teal-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase border border-teal-200">Đánh giá cao</span>
                            )}
                          </div>

                          <h3 className="font-bold text-slate-800 text-sm line-clamp-2 leading-tight group-hover:text-teal-600 transition-colors mb-1">
                            {deal.productName}
                          </h3>

                          <div className="flex flex-col gap-0.5">
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              ID: {deal.itemId?.substring(0, 8) || 'N/A'}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                              <span className="truncate max-w-[100px]">{deal.shopName}</span>
                              {(deal.storage || deal.color) && (
                                <>
                                  <span className="w-0.5 h-0.5 rounded-full bg-slate-300"></span>
                                  <span className="text-slate-400 font-medium">{deal.storage} {deal.color}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-0.5 text-amber-500">
                              <Star className="w-3 h-3 fill-current" />
                              <span className="text-xs font-black">{(deal.rating || 0).toFixed(1)}</span>
                            </div>
                            <span className="text-slate-300">|</span>
                            <span className="text-[10px] text-slate-500 font-bold">Đã bán {formatSold(deal.sold || 0)}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="font-black text-teal-600 text-lg tracking-tighter leading-none">
                                {formatPrice(deal.price)}
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">Giá hời nhất</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm">
                                -{deal.discountPercent}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>

                {/* Trending Searches */}
                <div className="mt-16 pt-12 border-t border-slate-200">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 text-center">Xu Hướng Tìm Kiếm</h3>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {trends.map(keyword => (
                      <button
                        key={keyword}
                        onClick={() => {
                          setUrl(keyword);
                          handleSubmit({ preventDefault: () => { } } as any, keyword);
                        }}
                        className="px-5 py-2.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-500 text-slate-600 hover:text-teal-600 rounded-full text-sm font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2"
                      >
                        <Search className="w-3 h-3 opacity-50" /> {keyword}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {hotDeals.length === 0 && !loadingHotDeals && (
              <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-12 text-center text-slate-400">
                Chưa có deal hot nào hôm nay. Hãy thử tìm kiếm sản phẩm bạn quan tâm!
              </div>
            )}
          </div>
        )}


        {/* --- SCROLLABLE RESULTS BLOCKS (Matching screenshot layout perfectly) --- */}
        {hasSearched && result && (
          <div className="w-full max-w-7xl mx-auto px-6 space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            {/* 1. Search Results summary block */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-black text-[#0f172a] flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-teal-600" /> Danh Sách Sản Phẩm
                </h2>

                <div className="flex items-center gap-3">
                  {dataSource && (
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${dataSource === 'cache' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                      dataSource === 'db' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                        'bg-teal-50 text-teal-600 border-teal-200'
                      }`}>
                      NGUỒN: {dataSource === 'db' ? 'CƠ SỞ DỮ LIỆU' : dataSource === 'cache' ? 'BỘ NHỚ ĐỆM' : 'TRUY XUẤT TRỰC TIẾP'}
                    </div>
                  )}
                  {catalogProduct && (
                    <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest border border-slate-200">
                      LƯỢT TÌM KIẾM: {catalogProduct.searchCount || 0}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col md:flex-row md:items-center gap-6 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                {/* Image square */}
                <div className="w-20 h-20 bg-[#e2e8f0] rounded flex items-center justify-center overflow-hidden shrink-0 border border-slate-100 relative">
                  {result.bestDeal.image ? (
                    <Image src={result.bestDeal.image} fill className="object-contain p-1" alt="product" />
                  ) : (
                    <Zap className="w-6 h-6 text-slate-400" />
                  )}
                </div>

                {/* Title & Market Price */}
                <div className="flex-1">
                  <h3 className="font-extrabold text-lg text-slate-900 mb-2 leading-snug">{result.bestDeal.title}</h3>
                  <div className="text-[10px] text-slate-400 font-black mb-1 uppercase tracking-[0.2em]">GIÁ THỊ TRƯỜNG</div>
                  <div className="text-3xl font-black text-slate-900 tracking-tighter">
                    {dealDetection ? formatPrice(dealDetection.meanPrice) : formatPrice(result.bestDeal.price)}
                  </div>
                  <div className="flex items-end gap-x-12 mt-4">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">KHOẢNG GIÁ</div>
                      <div className="text-sm font-bold text-slate-700">
                        {formatPrice(Math.min(...result.sellerList.map(l => l.price)))} - {formatPrice(Math.max(...result.sellerList.map(l => l.price)))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">ĐÁNH GIÁ TB</div>
                      <div className="text-sm font-bold text-slate-700 flex items-center gap-1">
                        {(result.sellerList.reduce((acc, curr) => acc + curr.rating, 0) / result.sellerList.length).toFixed(1)}
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Purchase Button for the main product */}
                <div className="text-left md:text-right mt-4 md:mt-0 shrink-0">
                  <a
                    href={redirectUrl(result.bestDeal)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full md:w-auto items-center justify-center gap-2 bg-[#0f172a] hover:bg-teal-600 active:scale-95 text-white py-3 px-8 rounded-xl font-black text-sm transition-all shadow-md group"
                  >
                    <ShoppingCart className="w-4 h-4 transition-transform group-hover:-rotate-12" />
                    XEM TRÊN SHOPEE
                  </a>
                </div>
              </div>
            </div>

            {/* 2. Best Deal Available Block */}
            <div className="w-full mt-4">
              <h2 className="text-2xl font-black text-[#0f172a] mb-4 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-teal-600" /> Deal Tốt Nhất
              </h2>
              <div className="bg-white border-2 border-teal-500/10 rounded-xl p-8 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />

                <div className="flex items-center gap-3 mb-6">
                  <div className="inline-flex items-center gap-1.5 bg-teal-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-lg">
                    <Zap className="w-2.5 h-2.5 fill-white" /> LỰA CHỌN TỐT NHẤT
                  </div>
                  {result.bestDeal.isDeal && (
                    <div className="inline-flex items-center gap-1.5 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-lg animate-pulse">
                      <Flame className="w-2.5 h-2.5 fill-white" /> DEAL HỜI -{result.bestDeal.discountPercent}%
                    </div>
                  )}
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start gap-10">

                  <div className="w-full md:w-48 h-48 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 shrink-0 shadow-sm flex items-center justify-center relative">
                    {result.bestDeal.image ? (
                      <Image src={result.bestDeal.image} fill className="object-contain p-4 hover:scale-110 transition-transform duration-500" alt="best-deal" />
                    ) : (
                      <Zap className="w-12 h-12 text-slate-200" />
                    )}
                  </div>

                  <div className="flex-1 w-full">
                    <h3 className="font-extrabold text-xl text-slate-900 mb-4 leading-snug line-clamp-2" title={result.bestDeal.title}>
                      {result.bestDeal.title}
                    </h3>
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">NHÀ BÁN HÀNG</div>
                    <h4 className="text-lg font-black text-slate-900 mb-6">{result.bestDeal.shop}</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
                      <div className="flex justify-between items-center text-sm font-semibold">
                        <span className="text-slate-500">Đánh giá</span>
                        <span className="font-black flex items-center gap-1 text-slate-900">{result.bestDeal.rating.toFixed(1)} <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /></span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-semibold">
                        <span className="text-slate-500">Đã bán</span>
                        <span className="font-black text-slate-900">{formatSold(result.bestDeal.sold)} sản phẩm</span>
                      </div>
                    </div>

                    <div className="mt-8 flex items-center gap-2 text-[11px] font-black text-teal-600 uppercase tracking-widest">
                      <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
                      Miễn phí vận chuyển · Giao trong 3-5 ngày
                    </div>
                  </div>

                  <div className="text-left w-full md:w-auto md:text-right">
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">GIÁ ƯU ĐÃI</div>
                    <div className="text-[3.5rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-slate-900 to-slate-700 leading-none mb-2 tracking-tighter">
                      {formatPrice(result.bestDeal.price)}
                    </div>
                    {(result.bestDeal.medianPrice || dealDetection) && (
                      <div className="text-sm text-slate-400 line-through font-bold mb-2 italic">
                        {formatPrice(result.bestDeal.medianPrice || dealDetection?.meanPrice || 0)}
                      </div>
                    )}
                    {result.bestDeal.isDeal && (
                      <div className="text-xs font-black text-red-500 mb-6">
                        Tiết kiệm {formatPrice((result.bestDeal.medianPrice || 0) - result.bestDeal.price)} so với giá thị trường
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <a
                        href={redirectUrl(result.bestDeal)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full md:w-60 items-center justify-center gap-3 bg-gradient-to-r from-[#003B73] to-[#004a8f] hover:shadow-[0_10px_25px_-10px_rgba(0,59,115,0.5)] active:scale-95 text-white py-4 px-6 rounded-xl font-black text-base transition-all shadow-lg"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        MUA NGAY
                        <ExternalLink className="w-4 h-4 ml-auto opacity-70" />
                      </a>

                      {result.bestDeal.listingId && (
                        <button
                          onClick={() => handleShare(result.bestDeal)}
                          className="inline-flex w-full md:w-auto items-center justify-center gap-2 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-600 py-4 px-6 rounded-xl font-black text-sm transition-all shadow-sm active:scale-95"
                        >
                          <Share2 className="w-4 h-4" />
                          CHIA SẺ
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* 3. Other Sellers Table Block */}
            <div className="w-full mt-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-black text-[#0f172a] flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-teal-600" /> Các Nhà Bán Khác
                </h2>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/50 border-b border-slate-100 whitespace-nowrap">
                      <tr className="text-slate-400 text-[10px] font-black tracking-[0.2em] uppercase">
                        <th className="px-6 py-5">SẢN PHẨM</th>
                        <th className="px-6 py-5">CỬA HÀNG</th>
                        <th className="px-6 py-5 cursor-pointer hover:text-teal-600 transition-colors group select-none" onClick={() => toggleSort("price")}>
                          <div className="flex items-center gap-1.5">
                            GIÁ
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[11px] transition-colors ${sortBy === "price" ? "bg-teal-100 text-teal-700 font-black" : "bg-transparent text-slate-300 group-hover:bg-slate-50 group-hover:text-slate-500"}`}>
                              {sortBy === "price" ? (sortOrder === "asc" ? "↑" : "↓") : "↑"}
                            </span>
                          </div>
                        </th>
                        <th className="px-6 py-5">ĐÁNH GIÁ</th>
                        <th className="px-6 py-5 cursor-pointer hover:text-teal-600 transition-colors group select-none" onClick={() => toggleSort("sold")}>
                          <div className="flex items-center gap-1.5">
                            ĐÃ BÁN
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[11px] transition-colors ${sortBy === "sold" ? "bg-teal-100 text-teal-700 font-black" : "bg-transparent text-slate-300 group-hover:bg-slate-50 group-hover:text-slate-500"}`}>
                              {sortBy === "sold" ? (sortOrder === "asc" ? "↑" : "↓") : "↓"}
                            </span>
                          </div>
                        </th>
                        <th className="px-6 py-5 text-right">HÀNH ĐỘNG</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700">
                      {result.sellerList
                        .filter(l => l.url !== result.bestDeal.url)
                        .slice() // copy array to avoid mutation
                        .sort((a, b) => {
                          const multiplier = sortOrder === "asc" ? 1 : -1;
                          const valA = sortBy === "price" ? a.price : a.sold;
                          const valB = sortBy === "price" ? b.price : b.sold;
                          return (valA - valB) * multiplier;
                        })
                        .map((listing, i) => (
                          <tr key={i} className="hover:bg-teal-50/30 transition-colors group">
                            <td className="px-6 py-5 min-w-[300px]">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded bg-[#f1f5f9] border border-slate-100 shrink-0 flex items-center justify-center overflow-hidden relative">
                                  {listing.image ? (
                                    <Image src={listing.image} fill className="object-cover" alt="thumb" />
                                  ) : (
                                    <Zap className="w-4 h-4 text-slate-300" />
                                  )}
                                  {listing.isDeal && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                      <Flame className="w-2.5 h-2.5 text-white fill-white" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug">
                                    {listing.title}
                                  </div>
                                  {listing.isDeal && (
                                    <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                                      <Flame className="w-2.5 h-2.5" /> DEAL HỜI -{listing.discountPercent}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 min-w-[200px] whitespace-normal">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                                  {listing.shop.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-black text-slate-900 text-[11px] group-hover:text-teal-600 transition-colors">{listing.shop}</div>
                                  <div className="text-[9px] text-slate-400 uppercase tracking-widest font-black">{listing.marketplace}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 font-black text-slate-900 text-base whitespace-nowrap">
                              <div>{formatPrice(listing.price)}</div>
                              {listing.isDeal && listing.medianPrice && (
                                <div className="text-[10px] text-slate-400 line-through">{formatPrice(listing.medianPrice)}</div>
                              )}
                            </td>
                            <td className="px-6 py-5 font-black whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                {listing.rating.toFixed(1)} <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              </div>
                            </td>
                            <td className="px-6 py-5 font-bold text-slate-500 whitespace-nowrap">
                              {formatSold(listing.sold)}
                            </td>
                            <td className="px-6 py-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {listing.listingId && (
                                  <button
                                    onClick={() => handleShare(listing)}
                                    className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                    title="Chia sẻ deal"
                                  >
                                    <Share2 className="w-4 h-4" />
                                  </button>
                                )}
                                <a
                                  href={redirectUrl(listing)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-teal-600 hover:text-white border-2 border-slate-100 hover:border-teal-600 text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-lg transition-all shadow-sm active:scale-95"
                                >
                                  <ShoppingCart className="w-3.5 h-3.5" /> MUA
                                </a>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 4. Bottom Analytics Grid */}
            <div className="grid md:grid-cols-2 gap-6 w-full mb-8">

              {/* AI Review Summary */}
              <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xl">
                <h3 className="font-black text-xl text-[#0f172a] mb-6 flex items-center gap-2">
                  <Info className="w-5 h-5 text-teal-600" /> Tóm tắt đánh giá AI
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                  <div>
                    <div className="flex items-center gap-2 font-black text-teal-600 text-xs uppercase tracking-widest mb-4">
                      <TrendingUp className="w-4 h-4" /> ƯU ĐIỂM
                    </div>
                    <ul className="space-y-3 text-sm text-slate-600 font-medium">
                      <li className="flex items-start gap-3"><Check className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" /> Sản phẩm chính hãng từ gian hàng uy tín</li>
                      <li className="flex items-start gap-3"><Check className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" /> Giao hàng nhanh và đáng tin cậy</li>
                      <li className="flex items-start gap-3"><Check className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" /> Chăm sóc khách hàng xuất sắc</li>
                      <li className="flex items-start gap-3"><Check className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" /> Đóng gói sản phẩm kỹ lưỡng</li>
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 font-black text-rose-500 text-xs uppercase tracking-widest mb-4">
                      <TrendingDown className="w-4 h-4" /> NHƯỢC ĐIỂM
                    </div>
                    <ul className="space-y-3 text-sm text-slate-600 font-medium">
                      <li className="flex items-start gap-3"><span className="text-rose-400 mt-0.5 font-black shrink-0 leading-none">✕</span> Giá cao hơn một chút so với mặt bằng</li>
                      <li className="flex items-start gap-3"><span className="text-rose-400 mt-0.5 font-black shrink-0 leading-none">✕</span> Số lượng sản phẩm trong kho còn ít</li>
                      <li className="flex items-start gap-3"><span className="text-rose-400 mt-0.5 font-black shrink-0 leading-none">✕</span> Có báo cáo thỉnh thoảng hộp bị móp nhẹ</li>
                    </ul>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 font-black italic tracking-widest">Dựa trên 147 đánh giá từ khách hàng đã mua sản phẩm</div>
              </div>

              {/* Price History Block */}
              <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xl flex flex-col relative overflow-hidden">
                <h3 className="font-black text-xl text-[#0f172a] mb-8 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-teal-600" /> Lịch sử giá
                </h3>

                {/* Chart */}
                {(() => {
                  const historyPrices = priceHistory.length > 0
                    ? priceHistory.map(h => h.price)
                    : [0.93, 0.95, 1.0, 0.88, 0.92, 0.90, 0.87].map(m => result.bestDeal.price * m);
                  const minH = Math.min(...historyPrices);
                  const maxH = Math.max(...historyPrices);
                  const range = maxH - minH || 1;
                  const labels = priceHistory.length > 0
                    ? priceHistory.map(h => new Date(h.recordedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }))
                    : ['T3 01', 'T3 05', 'T3 10', 'T3 15', 'T3 20', 'T3 25', 'T3 30'];

                  return (
                    <div className="flex-1 flex items-end gap-3 text-[9px] text-slate-400 font-black uppercase tracking-widest pt-12 pb-2 h-40 w-full border-b border-slate-100">
                      {historyPrices.map((p, i) => {
                        const pct = ((p - minH) / range) * 80 + 20;
                        const isLowest = p === minH;
                        return (
                          <div key={i} className="flex-1 flex flex-col justify-end items-center gap-2 h-full group/bar relative">
                            <div className="absolute -top-6 opacity-0 group-hover/bar:opacity-100 text-[10px] text-slate-600 font-black transition-opacity bg-white px-2 py-1 rounded shadow-sm border border-slate-100 whitespace-nowrap">
                              {formatPrice(p)}
                            </div>
                            <div
                              className={`w-full rounded-t-md transition-all cursor-crosshair ${isLowest
                                ? 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                                : 'bg-teal-500/80 hover:bg-teal-500'
                                }`}
                              style={{ height: `${pct}%` }}
                            />
                            {i % Math.max(1, Math.floor(historyPrices.length / 7)) === 0 && labels[i]}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                <div className="flex justify-between items-center mt-6">
                  <div>
                    <div className="text-[10px] text-slate-400 font-black tracking-widest uppercase mb-1">THẤP NHẤT</div>
                    <div className="text-base font-black text-teal-600">
                      {formatPrice(result.bestDeal.lowestPrice || result.bestDeal.price * 0.9)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-black tracking-widest uppercase mb-1">GIÁ THỊ TRƯỜNG</div>
                    <div className="text-base font-black text-[#0f172a]">
                      {formatPrice(result.bestDeal.medianPrice || dealDetection?.meanPrice || result.bestDeal.price * 1.1)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-black tracking-widest uppercase mb-1">GIÁ HIỆN TẠI</div>
                    <div className="text-base font-black text-teal-600">{formatPrice(result.bestDeal.price)}</div>
                  </div>
                </div>
                {priceHistory.length === 0 && (
                  <div className="text-[10px] text-slate-400 font-medium mt-4 italic">
                    * Dữ liệu mẫu — giá thực tế sẽ hiển thị khi đủ lịch sử
                  </div>
                )}
              </div>

            </div>

            {/* 5. Browser Extension Banner */}
            <div className="w-full bg-white rounded-lg border border-slate-200 p-6 shadow-[0_2px_4px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
              <div className="flex items-center z-10 gap-5">
                <div className="w-14 h-14 bg-[#003B73] rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-white">
                  <Chrome className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-black text-[#0f172a] text-xl mb-2">Tiện ích Trình duyệt</h3>
                  <p className="text-slate-500 text-sm max-w-sm font-medium mb-5">Cài đặt tiện ích mở rộng để tự động tìm giá rẻ nhất khi lướt web trên trang thương mại điện tử.</p>
                  <div className="flex gap-4">
                    <button className="bg-[#003B73] hover:bg-[#002a54] text-white px-6 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all active:scale-95"><Download className="w-4 h-4" /> Cài Đặt Tiện Ích</button>
                    <button className="bg-white border-2 border-slate-100 text-slate-600 px-6 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all font-bold">Tìm hiểu thêm</button>
                  </div>
                </div>
              </div>

              {/* Decorative UI element for extension banner */}
              <div className="hidden md:flex flex-col bg-white border border-slate-200 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.08)] w-64 p-3 z-10 translate-y-4 translate-x-4 shrink-0">
                <div className="flex gap-1.5 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div><div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div><div className="w-2.5 h-2.5 rounded-full bg-teal-400"></div>
                </div>
                <div className="space-y-2 border-b border-slate-100 pb-3 mb-2">
                  <div className="w-full h-2 bg-slate-800 rounded-sm"></div>
                  <div className="w-3/4 h-2 bg-slate-200 rounded-sm"></div>
                </div>
                <div className="text-[10px] font-bold text-teal-600 flex items-center gap-1 mt-1"><Check className="w-3 h-3" /> Giá tốt nhất: {formatPrice(result.bestDeal.price)}</div>
              </div>
            </div>

          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
