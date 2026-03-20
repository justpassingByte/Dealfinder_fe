"use client";

import { useState } from "react";
import { ScraperCommandStep } from "@/lib/scraperProfiles";

interface Props {
    title: string;
    steps: ScraperCommandStep[];
}

export default function ScraperCommandGuide({ title, steps }: Props) {
    const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

    async function handleCopy(command: string) {
        await navigator.clipboard.writeText(command);
        setCopiedCommand(command);
        setTimeout(() => setCopiedCommand(null), 1500);
    }

    return (
        <section className="admin-card">
            <div className="admin-card-header">
                <div>
                    <h3>{title}</h3>
                    <p className="text-muted">Use the exact commands below when you need terminal help.</p>
                </div>
            </div>

            <div className="command-guide-list">
                {steps.map((step) => (
                    <article className="command-guide-step" key={`${title}-${step.title}`}>
                        <div className="command-guide-meta">
                            <div>
                                <h4>{step.title}</h4>
                                <p className="text-muted">{step.description}</p>
                            </div>
                            <button
                                className="btn-secondary btn-sm"
                                onClick={() => void handleCopy(step.command)}
                                type="button"
                            >
                                {copiedCommand === step.command ? "Copied" : "Copy"}
                            </button>
                        </div>
                        <pre className="command-guide-pre">{step.command}</pre>
                    </article>
                ))}
            </div>
        </section>
    );
}
