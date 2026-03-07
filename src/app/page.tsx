"use client";

import { useState, FormEvent, useCallback } from "react";
import { Search, Zap, Check, ExternalLink, TrendingDown, Star, ShoppingCart, Info, TrendingUp, Download, Chrome, LayoutGrid, Filter } from "lucide-react";
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

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function formatPrice(price: number): string {
  return price.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });
}

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // Results State
  const [hasSearched, setHasSearched] = useState(false);
  const [searchStatus, setSearchStatus] = useState("");
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [dealDetection, setDealDetection] = useState<DealDetectionResult | null>(null);

  // Sort State
  const [sortBy, setSortBy] = useState<"price" | "sold">("price");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const toggleSort = (col: "price" | "sold") => {
    if (sortBy === col) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortOrder(col === "price" ? "asc" : "desc"); // Giá mặc định tăng dần (rẻ nhất), Đã bán mặc định giảm dần (nhiều nhất)
    }
  };

  const fetchResults = useCallback(async (q: string) => {
    try {
      setSearchStatus("Đang tìm kiếm sản phẩm tốt nhất trên Shopee...");
      // 1. Search
      const searchRes = await fetch(`${API}/api/search?q=${encodeURIComponent(q)}`);

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

    setSearchStatus("Đang phân tích URL sản phẩm...");
    try {
      const res = await fetch(`${API}/api/analyze-product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Phân tích sản phẩm thất bại.");
        setLoading(false);
        setSearchStatus("");
        return;
      }

      // kick off the fetch
      await fetchResults(data.query);
    } catch {
      alert("Network error. Make sure the API server is running.");
      setLoading(false);
      setSearchStatus("");
    }
  }

  const redirectUrl = (productUrl: string) =>
    `${API}/api/redirect?url=${encodeURIComponent(productUrl)}`;

  return (
    <div className={`flex flex-col bg-[#F3F4F6] text-slate-900 font-sans selection:bg-teal-100 min-h-screen`}>
      {/* Navbar - Restyled exactly like layout */}
      <header className="sticky top-0 z-50 bg-[#F3F4F6] border-b border-slate-200 h-[60px] flex flex-col justify-center shrink-0">
        <div className="w-full max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => {
              setHasSearched(false);
              setUrl("");
            }}
          >
            <div className="bg-[#1e293b] text-white w-7 h-7 rounded shrink-0 flex items-center justify-center font-bold text-xs">
              DF
            </div>
            <span className="font-bold text-lg tracking-tight hidden sm:block">ShopeeBest</span>
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
                placeholder="Tìm sản phẩm Shopee (tên hoặc link)..."
                className="w-full pl-9 pr-4 py-1.5 bg-[#e2e8f0] border-none rounded-md text-sm focus:ring-2 focus:ring-[#0f172a] outline-none placeholder:text-slate-500"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </form>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-sm font-semibold hover:text-teal-600 transition-colors">
              Đăng Nhập
            </button>
            <div className="w-7 h-7 rounded-sm bg-slate-200 flex items-center justify-center overflow-hidden cursor-pointer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
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
                  CẬP NHẬT GIÁ SHOPEE THEO THỜI GIAN THỰC
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight leading-[1.1]">
                  Tìm Sản Phẩm <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-teal-400">Tốt Nhất</span> <br />
                  Tại Shopee
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
                  placeholder="Dán link sản phẩm Shopee hoặc nhập tên sản phẩm..."
                  className="w-full pl-16 pr-6 py-6 bg-transparent text-xl font-medium outline-none placeholder:text-slate-300 transition-all text-slate-800"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

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


        {/* --- SCROLLABLE RESULTS BLOCKS (Matching screenshot layout perfectly) --- */}
        {hasSearched && result && (
          <div className="w-full max-w-7xl mx-auto px-6 space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            {/* 1. Search Results summary block */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-black text-[#0f172a] flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-teal-600" /> Danh Sách Sản Phẩm Shopee
                </h2>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col md:flex-row md:items-center gap-6 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                {/* Image square */}
                <div className="w-20 h-20 bg-[#e2e8f0] rounded flex items-center justify-center overflow-hidden shrink-0 border border-slate-100">
                  {result.bestDeal.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={result.bestDeal.image} className="max-w-full max-h-full object-contain" alt="product" />
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
                    href={redirectUrl(result.bestDeal.url)}
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

                <div className="inline-flex items-center gap-1.5 bg-teal-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-lg mb-6">
                  <Zap className="w-2.5 h-2.5 fill-white" /> LỰA CHỌN TỐT NHẤT
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start gap-10">

                  <div className="w-full md:w-48 h-48 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 shrink-0 shadow-sm flex items-center justify-center">
                    {result.bestDeal.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={result.bestDeal.image} className="w-full h-full object-contain hover:scale-110 transition-transform duration-500" alt="best-deal" />
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
                        <span className="font-black text-slate-900">{result.bestDeal.sold.toLocaleString()} sản phẩm</span>
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
                    {dealDetection && (
                      <div className="text-sm text-slate-400 line-through font-bold mb-6 italic">
                        {formatPrice(dealDetection.meanPrice)}
                      </div>
                    )}

                    <a
                      href={redirectUrl(result.bestDeal.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full md:w-60 items-center justify-center gap-3 bg-gradient-to-r from-[#003B73] to-[#004a8f] hover:shadow-[0_10px_25px_-10px_rgba(0,59,115,0.5)] active:scale-95 text-white py-4 px-6 rounded-xl font-black text-base transition-all shadow-lg"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      MUA NGAY
                      <ExternalLink className="w-4 h-4 ml-auto opacity-70" />
                    </a>
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
                                <div className="w-12 h-12 rounded bg-[#f1f5f9] border border-slate-100 shrink-0 flex items-center justify-center overflow-hidden">
                                  {listing.image ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={listing.image} className="w-full h-full object-cover" alt="thumb" />
                                  ) : (
                                    <Zap className="w-4 h-4 text-slate-300" />
                                  )}
                                </div>
                                <div className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug">
                                  {listing.title}
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
                              {formatPrice(listing.price)}
                            </td>
                            <td className="px-6 py-5 font-black whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                {listing.rating.toFixed(1)} <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              </div>
                            </td>
                            <td className="px-6 py-5 font-bold text-slate-500 whitespace-nowrap">
                              {listing.sold.toLocaleString()}
                            </td>
                            <td className="px-6 py-5 text-right">
                              <a
                                href={redirectUrl(listing.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-teal-600 hover:text-white border-2 border-slate-100 hover:border-teal-600 text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-lg transition-all shadow-sm active:scale-95"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" /> MUA
                              </a>
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
                  <TrendingUp className="w-5 h-5 text-teal-600" /> Lịch sử giá (30 ngày gần đây)
                </h3>

                {/* Fake Chart Grid */}
                <div className="flex-1 flex items-end gap-3 text-[9px] text-slate-400 font-black uppercase tracking-widest pt-12 pb-2 h-40 w-full border-b border-slate-100">
                  <div className="flex-1 flex flex-col justify-end items-center gap-2 h-full"><div className="w-full bg-teal-500/80 hover:bg-teal-500 rounded-t-md transition-all cursor-crosshair" style={{ height: '30%' }}></div>T3 01</div>
                  <div className="flex-1 flex flex-col justify-end items-center gap-2 h-full"><div className="w-full bg-teal-500/80 hover:bg-teal-500 rounded-t-md transition-all cursor-crosshair" style={{ height: '40%' }}></div>T3 05</div>
                  <div className="flex-1 flex flex-col justify-end items-center gap-2 h-full"><div className="w-full bg-emerald-400 rounded-t-md transition-all cursor-crosshair shadow-[0_0_15px_rgba(52,211,153,0.3)]" style={{ height: '100%' }}></div>T3 10</div>
                  <div className="flex-1 flex flex-col justify-end items-center gap-2 h-full"><div className="w-full bg-teal-500/80 hover:bg-teal-500 rounded-t-md transition-all cursor-crosshair" style={{ height: '80%' }}></div>T3 15</div>
                  <div className="flex-1 flex flex-col justify-end items-center gap-2 h-full"><div className="w-full bg-teal-500/80 hover:bg-teal-500 rounded-t-md transition-all cursor-crosshair" style={{ height: '75%' }}></div>T3 20</div>
                  <div className="flex-1 flex flex-col justify-end items-center gap-2 h-full"><div className="w-full bg-teal-500/80 hover:bg-teal-500 rounded-t-md transition-all cursor-crosshair" style={{ height: '70%' }}></div>T3 25</div>
                  <div className="flex-1 flex flex-col justify-end items-center gap-2 h-full"><div className="w-full bg-teal-500/80 hover:bg-teal-500 rounded-t-md transition-all cursor-crosshair" style={{ height: '60%' }}></div>T3 30</div>
                </div>

                <div className="flex justify-between items-center mt-6">
                  <div>
                    <div className="text-[10px] text-slate-400 font-black tracking-widest uppercase mb-1">THẤP NHẤT</div>
                    <div className="text-base font-black text-teal-600">{formatPrice(result.bestDeal.price * 0.9)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-black tracking-widest uppercase mb-1">CAO NHẤT</div>
                    <div className="text-base font-black text-[#0f172a]">{formatPrice(result.bestDeal.price * 1.4)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-black tracking-widest uppercase mb-1">GIÁ HIỆN TẠI</div>
                    <div className="text-base font-black text-teal-600">{formatPrice(result.bestDeal.price)}</div>
                  </div>
                </div>
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
