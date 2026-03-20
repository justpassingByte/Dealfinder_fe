"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function Navbar() {
    const { user, logout, loading } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className="nav">
            <div className="container nav-inner">
                <Link href="/" className="logo">
                    DealFinder
                </Link>

                <div className="nav-actions">
                    <Link href="/admin/scraper-profiles" className="nav-link">
                        Scraper Admin
                    </Link>
                    {loading ? null : user ? (
                        <div className="nav-user">
                            <button
                                className="nav-user-btn"
                                onClick={() => setMenuOpen(!menuOpen)}
                                id="user-menu-btn"
                            >
                                <span className="nav-avatar">
                                    {user.email.charAt(0).toUpperCase()}
                                </span>
                                <span className="nav-email">{user.email}</span>
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                                </svg>
                            </button>
                            {menuOpen && (
                                <div className="nav-dropdown">
                                    <Link
                                        href="/dashboard"
                                        className="nav-dropdown-item"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        📊 Bảng điều khiển
                                    </Link>
                                    <button
                                        className="nav-dropdown-item"
                                        onClick={() => {
                                            logout();
                                            setMenuOpen(false);
                                        }}
                                        id="logout-btn"
                                    >
                                        🚪 Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="nav-auth-links">
                            <Link href="/login" className="nav-link" id="nav-login">
                                Đăng Nhập
                            </Link>
                            <Link href="/register" className="btn-primary btn-sm" id="nav-register">
                                Đăng Ký
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
