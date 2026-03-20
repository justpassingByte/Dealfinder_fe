"use client";

import { useState } from "react";
import { ScraperProfile } from "@/lib/scraperProfiles";

interface Props {
    profile: ScraperProfile;
    actionBusy?: boolean;
    onDelete: () => Promise<void> | void;
}

export default function ScraperArchiveDialog({ profile, actionBusy = false, onDelete }: Props) {
    const [confirmed, setConfirmed] = useState(false);

    return (
        <section className="admin-card admin-card-danger" id="delete">
            <div className="admin-card-header">
                <div>
                    <h3>Delete Profile</h3>
                    <p className="text-muted">This permanently deletes the profile record from the app. It does not delete the VPS folder for you.</p>
                </div>
            </div>

            <div className="admin-inline-note">
                <strong>Profile:</strong> {profile.displayName}
                {" | "}
                <strong>Status:</strong> {profile.effectiveStatus}
            </div>

            <label className="admin-checkbox">
                <input checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" />
                <span>I already reviewed the VPS cleanup commands above. This button only deletes the app record; it does not remove the real browser folder for me.</span>
            </label>

            <button
                className="btn-danger"
                disabled={!confirmed || actionBusy}
                onClick={() => void onDelete()}
                type="button"
            >
                {actionBusy ? "Deleting..." : "Delete Profile"}
            </button>
        </section>
    );
}
