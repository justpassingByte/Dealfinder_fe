import { ScraperProfileSummary } from "@/lib/scraperProfiles";

interface Props {
    summary: ScraperProfileSummary;
}

const cards: Array<{ key: keyof ScraperProfileSummary; label: string }> = [
    { key: "totalProfiles", label: "Total Profiles" },
    { key: "runnableProfiles", label: "Runnable" },
    { key: "blockedProfiles", label: "Blocked" },
    { key: "recoveringProfiles", label: "Recovering" },
    { key: "warmingProfiles", label: "Warming" },
    { key: "offlineProfiles", label: "Offline" },
    { key: "archivedProfiles", label: "Archived" },
    { key: "captchaCount24h", label: "CAPTCHA 24h" },
];

export default function ScraperProfileSummaryCards({ summary }: Props) {
    return (
        <section className="admin-summary-grid">
            {cards.map((card) => (
                <article className="admin-summary-card" key={card.key}>
                    <span className="admin-summary-label">{card.label}</span>
                    <strong className="admin-summary-value">{summary[card.key]}</strong>
                </article>
            ))}
            <article className="admin-summary-card admin-summary-card-wide">
                <span className="admin-summary-label">Average Risk</span>
                <strong className="admin-summary-value">{summary.averageRisk}</strong>
            </article>
        </section>
    );
}
