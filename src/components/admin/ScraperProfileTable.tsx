"use client";

import Link from "next/link";
import { ScraperProfileListItem } from "@/lib/scraperProfiles";

interface Props {
    profiles: ScraperProfileListItem[];
    onRecover: (profile: ScraperProfileListItem) => void;
    onWarm: (profile: ScraperProfileListItem) => void;
    onEdit: (profile: ScraperProfileListItem) => void;
    onArchive: (profile: ScraperProfileListItem) => void;
}

function formatDate(value: string | null): string {
    if (!value) {
        return "Never";
    }
    return new Date(value).toLocaleString();
}

function statusClass(status: string): string {
    return `admin-status admin-status-${status}`;
}

export default function ScraperProfileTable({ profiles, onRecover, onWarm, onEdit, onArchive }: Props) {
    return (
        <section className="admin-card">
            <div className="admin-card-header">
                <div>
                    <h3>Profiles</h3>
                    <p className="text-muted">Monitor health, trigger recovery, and open the detail workflow.</p>
                </div>
            </div>

            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Worker</th>
                            <th>Risk</th>
                            <th>Heartbeat</th>
                            <th>Requests 24h</th>
                            <th>Success 24h</th>
                            <th>CAPTCHA 24h</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {profiles.map((profile) => (
                            <tr key={profile.id}>
                                <td>
                                    <div className="admin-table-title">
                                        <strong>{profile.displayName}</strong>
                                        <span className="text-muted">{profile.profileMountName}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={statusClass(profile.effectiveStatus)}>{profile.effectiveStatus}</span>
                                </td>
                                <td>{profile.assignedWorkerId}</td>
                                <td>{profile.riskScore}</td>
                                <td>{formatDate(profile.lastHeartbeatAt)}</td>
                                <td>{profile.stats.requestCount24h}</td>
                                <td>{profile.stats.successRate24h}%</td>
                                <td>{profile.stats.captchaCount24h}</td>
                                <td>
                                    <div className="admin-action-row">
                                        <Link className="btn-secondary btn-sm" href={`/admin/scraper-profiles/${profile.id}`}>
                                            View
                                        </Link>
                                        <button className="btn-secondary btn-sm" onClick={() => onRecover(profile)} type="button">
                                            Recover
                                        </button>
                                        <button className="btn-secondary btn-sm" onClick={() => onWarm(profile)} type="button">
                                            Warm
                                        </button>
                                        <button className="btn-secondary btn-sm" onClick={() => onEdit(profile)} type="button">
                                            Edit
                                        </button>
                                        <button className="btn-danger btn-sm" onClick={() => onArchive(profile)} type="button">
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
