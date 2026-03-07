"use client";

import Link from "next/link";
import { Zap, Facebook, Twitter, Instagram, Mail, ExternalLink } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
                {/* Brand Section */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-2">
                        <div className="bg-white text-[#0f172a] w-8 h-8 rounded flex items-center justify-center font-bold text-sm shadow-xl">
                            SB
                        </div>
                        <span className="font-black text-xl tracking-tight">ShopeeBest</span>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-xs font-medium">
                        Công cụ hỗ trợ tìm kiếm sản phẩm chất lượng nhất trên Shopee, giúp bạn mua sắm thông minh và tiết kiệm hơn mỗi ngày.
                    </p>
                    <div className="flex items-center gap-4 pt-2 text-slate-400">
                        <a href="#" className="hover:text-white transition-colors"><Facebook className="w-5 h-5" /></a>
                        <a href="#" className="hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
                        <a href="#" className="hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
                    </div>
                </div>

                {/* Quick Links */}
                <div>
                    <h4 className="text-white font-bold mb-5">Liên Kết Nhanh</h4>
                    <ul className="space-y-3 text-sm">
                        <li><Link href="/" className="hover:text-teal-400 transition-colors">Trang chủ</Link></li>
                        <li><Link href="/dashboard" className="hover:text-teal-400 transition-colors">Bảng điều khiển</Link></li>
                        <li><a href="#" className="hover:text-teal-400 transition-colors">Tiện ích trình duyệt</a></li>
                        <li><a href="#" className="hover:text-teal-400 transition-colors">Hướng dẫn sử dụng</a></li>
                    </ul>
                </div>

                {/* Support */}
                <div>
                    <h4 className="text-white font-bold mb-5">Hỗ Trợ</h4>
                    <ul className="space-y-3 text-sm">
                        <li><a href="#" className="hover:text-teal-400 transition-colors">Trung tâm trợ giúp</a></li>
                        <li><a href="#" className="hover:text-teal-400 transition-colors">Điều khoản dịch vụ</a></li>
                        <li><a href="#" className="hover:text-teal-400 transition-colors">Chính sách bảo mật</a></li>
                        <li><a href="#" className="hover:text-teal-400 transition-colors">Liên hệ quảng cáo</a></li>
                    </ul>
                </div>

                {/* Newsletter */}
                <div>
                    <h4 className="text-white font-bold mb-5">Đăng Ký Bản Tin</h4>
                    <p className="text-sm mb-4">Nhận thông báo về các ưu đãi sốc hàng tuần.</p>
                    <div className="flex gap-2">
                        <input
                            type="email"
                            placeholder="Email của bạn"
                            className="bg-slate-800 border-none rounded px-3 py-2 text-sm w-full outline-none focus:ring-1 focus:ring-teal-500"
                        />
                        <button className="bg-teal-600 hover:bg-teal-500 text-white px-3 py-2 rounded transition-colors shadow-lg">
                            <Mail className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
                <p>&copy; {new Date().getFullYear()} DealFinder. Tất cả quyền được bảo lưu. Made with ❤️ in Vietnam.</p>
            </div>
        </footer>
    );
}
