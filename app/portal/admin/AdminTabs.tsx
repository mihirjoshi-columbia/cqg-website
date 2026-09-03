"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
    { href: "/portal/admin/members", label: "Members" },
    { href: "/portal/admin/applications/membership", label: "Membership Apps" },
    { href: "/portal/admin/applications/cutc", label: "CUTC Apps" },
    { href: "/portal/admin/events", label: "Events" },
    { href: "/portal/admin/blasts", label: "Email Blasts" },
    { href: "/portal/admin/cycles", label: "Cycles" },
];

export default function AdminTabs() {
    const pathname = usePathname();
    return (
        <nav className="portal-tabs">
            {TABS.map((tab) => (
                <Link
                    key={tab.href}
                    href={tab.href}
                    className={`portal-tab ${pathname.startsWith(tab.href) ? "active" : ""}`}
                >
                    {tab.label}
                </Link>
            ))}
        </nav>
    );
}
