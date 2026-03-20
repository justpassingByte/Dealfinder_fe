import type { ScraperProfileStats } from "@/lib/scraperProfiles";

interface Props {
    stats: ScraperProfileStats;
}

const formatValue = (value: number | null, suffix = ""): string => {
    if (value === null) {
        return "N/A";
    }
    return `${value}${suffix}`;
};

export default function ScraperProfileStats({ stats }: Props) {
    return (
        <section className="admin-card">
            <div className="admin-card-header">
                <div>
                    <h3>Stats</h3>
                    <p className="text-muted">Last 24 hours plus current warmup progress.</p>
                </div>
            </div>

            <div className="admin-summary-grid">
                <article className="admin-summary-card">
                    <span className="admin-summary-label">Requests 24h</span>
                    <strong className="admin-summary-value">{stats.requestCount24h}</strong>
                </article>
                <article className="admin-summary-card">
                    <span className="admin-summary-label">Successes 24h</span>
                    <strong className="admin-summary-value">{stats.successCount24h}</strong>
                </article>
                <article className="admin-summary-card">
                    <span className="admin-summary-label">Success Rate</span>
                    <strong className="admin-summary-value">{stats.successRate24h}%</strong>
                </article>
                <article className="admin-summary-card">
                    <span className="admin-summary-label">CAPTCHA 24h</span>
                    <strong className="admin-summary-value">{stats.captchaCount24h}</strong>
                </article>
                <article className="admin-summary-card">
                    <span className="admin-summary-label">Avg Latency</span>
                    <strong className="admin-summary-value">{formatValue(stats.averageLatency24h, " ms")}</strong>
                </article>
                <article className="admin-summary-card">
                    <span className="admin-summary-label">Warmup Streak</span>
                    <strong className="admin-summary-value">{stats.currentWarmupStreak}</strong>
                </article>
            </div>
        </section>
    );
}
