"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

const getApiUrl = () => {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
        return "";
    }
    let url = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_INTERNAL_API_URL;
    if (!url) {
        if (process.env.NODE_ENV === "development") {
            url = "http://localhost:4000";
        } else {
            url = "";
        }
    }
    return url.replace(/\/api\/?$/, "").replace(/\/$/, "");
};

const API = getApiUrl();

interface CreatorProfile {
    id: string;
    referralCode: string;
    referralLink: string;
    commissionBalance: number;
}

interface DashboardStats {
    totalClicks: number;
    totalOrders: number;
    totalCommission: number;
    commissionBalance: number;
}

interface ClickRow {
    id: string;
    product_url: string;
    timestamp: string;
    ip: string;
}

interface OrderRow {
    id: string;
    affiliate_order_id: string;
    commission_amount: number;
    timestamp: string;
}

interface DashboardData {
    creator: CreatorProfile;
    stats: DashboardStats;
    recentClicks: ClickRow[];
    recentOrders: OrderRow[];
}

export default function DashboardPage() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [onboarding, setOnboarding] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"clicks" | "orders">("clicks");

    const fetchDashboard = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API}/api/creators/dashboard`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 404) {
                setError("NOT_CREATOR");
                setLoading(false);
                return;
            }
            if (!res.ok) {
                setError("Failed to load dashboard.");
                setLoading(false);
                return;
            }
            const json = await res.json();
            setData(json);
            setLoading(false);
        } catch {
            setError("Network error.");
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push("/login");
            return;
        }
        fetchDashboard();
    }, [authLoading, user, router, fetchDashboard]);

    async function handleOnboard() {
        setOnboarding(true);
        try {
            const res = await fetch(`${API}/api/creators/onboard`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setError("");
                await fetchDashboard();
            } else {
                const d = await res.json();
                setError(d.error || "Onboarding failed.");
            }
        } catch {
            setError("Network error.");
        } finally {
            setOnboarding(false);
        }
    }

    function copyLink(link: string) {
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    if (authLoading || loading) {
        return (
            <>
                <Navbar />
                <main className="container">
                    <div className="loader-wrapper">
                        <div className="spinner" />
                        <p>Loading dashboard…</p>
                    </div>
                </main>
            </>
        );
    }

    // Not a creator yet — show onboarding CTA
    if (error === "NOT_CREATOR") {
        return (
            <>
                <Navbar />
                <main className="container">
                    <section className="auth-page">
                        <div className="auth-card" style={{ textAlign: "center" }}>
                            <div className="onboard-icon">🚀</div>
                            <h1>Become a Creator</h1>
                            <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
                                Start earning commissions by sharing deals. Get your unique
                                referral link and track your earnings.
                            </p>
                            <button
                                className="btn-primary btn-full"
                                onClick={handleOnboard}
                                disabled={onboarding}
                                id="onboard-btn"
                            >
                                {onboarding ? "Setting up…" : "🎉 Become a Creator"}
                            </button>
                        </div>
                    </section>
                </main>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navbar />
                <main className="container">
                    <div className="error-box">
                        <h2>⚠️ Error</h2>
                        <p>{error}</p>
                    </div>
                </main>
            </>
        );
    }

    if (!data) return null;

    const { stats, recentClicks, recentOrders } = data;
    const referralLink = `${typeof window !== "undefined" ? window.location.origin : ""}/ref/${data.creator.referralCode}`;

    return (
        <>
            <Navbar />
            <main className="container">
                <div className="dashboard">
                    {/* Header */}
                    <div className="dashboard-header">
                        <div>
                            <h1>Creator Dashboard</h1>
                            <p className="text-muted">
                                Track your clicks, orders, and commissions
                            </p>
                        </div>
                    </div>

                    {/* Referral Link Card */}
                    <div className="referral-card">
                        <div className="referral-card-inner">
                            <div>
                                <h3>Your Referral Link</h3>
                                <p className="referral-code">
                                    Code: <strong>{data.creator.referralCode}</strong>
                                </p>
                            </div>
                            <div className="referral-link-row">
                                <input
                                    className="form-input referral-input"
                                    value={referralLink}
                                    readOnly
                                    id="referral-link-input"
                                />
                                <button
                                    className="btn-primary btn-sm"
                                    onClick={() => copyLink(referralLink)}
                                    id="copy-referral-btn"
                                >
                                    {copied ? "✓ Copied!" : "📋 Copy"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">👆</div>
                            <div className="stat-value">{stats.totalClicks.toLocaleString()}</div>
                            <div className="stat-label">Total Clicks</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">📦</div>
                            <div className="stat-value">{stats.totalOrders.toLocaleString()}</div>
                            <div className="stat-label">Total Orders</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">💰</div>
                            <div className="stat-value">
                                {stats.totalCommission.toLocaleString("vi-VN", {
                                    style: "currency",
                                    currency: "VND",
                                    maximumFractionDigits: 0,
                                })}
                            </div>
                            <div className="stat-label">Total Commission</div>
                        </div>
                        <div className="stat-card stat-card-accent">
                            <div className="stat-icon">🏦</div>
                            <div className="stat-value">
                                {stats.commissionBalance.toLocaleString("vi-VN", {
                                    style: "currency",
                                    currency: "VND",
                                    maximumFractionDigits: 0,
                                })}
                            </div>
                            <div className="stat-label">Balance</div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="dash-tabs">
                        <button
                            className={`dash-tab ${activeTab === "clicks" ? "active" : ""}`}
                            onClick={() => setActiveTab("clicks")}
                            id="tab-clicks"
                        >
                            Recent Clicks ({recentClicks.length})
                        </button>
                        <button
                            className={`dash-tab ${activeTab === "orders" ? "active" : ""}`}
                            onClick={() => setActiveTab("orders")}
                            id="tab-orders"
                        >
                            Recent Orders ({recentOrders.length})
                        </button>
                    </div>

                    {/* Clicks Table */}
                    {activeTab === "clicks" && (
                        <div className="dash-table-wrapper">
                            {recentClicks.length === 0 ? (
                                <p className="text-muted" style={{ padding: 24, textAlign: "center" }}>
                                    No clicks yet. Share your referral link to get started!
                                </p>
                            ) : (
                                <table className="seller-table" id="clicks-table">
                                    <thead>
                                        <tr>
                                            <th>Product URL</th>
                                            <th>Time</th>
                                            <th>IP</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentClicks.map((c) => (
                                            <tr key={c.id}>
                                                <td data-label="URL sản phẩm">
                                                    <span className="listing-title">
                                                        {c.product_url}
                                                    </span>
                                                </td>
                                                <td data-label="Thời gian">{new Date(c.timestamp).toLocaleString()}</td>
                                                <td data-label="IP">{c.ip || "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* Orders Table */}
                    {activeTab === "orders" && (
                        <div className="dash-table-wrapper">
                            {recentOrders.length === 0 ? (
                                <p className="text-muted" style={{ padding: 24, textAlign: "center" }}>
                                    No orders yet. Commissions appear after affiliate reconciliation.
                                </p>
                            ) : (
                                <table className="seller-table" id="orders-table">
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Commission</th>
                                            <th>Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentOrders.map((o) => (
                                            <tr key={o.id}>
                                                <td data-label="Mã đơn hàng">{o.affiliate_order_id}</td>
                                                <td data-label="Hoa hồng" style={{ color: "var(--green)", fontWeight: 600 }}>
                                                    {o.commission_amount.toLocaleString("vi-VN", {
                                                        style: "currency",
                                                        currency: "VND",
                                                        maximumFractionDigits: 0,
                                                    })}
                                                </td>
                                                <td data-label="Thời gian">{new Date(o.timestamp).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
