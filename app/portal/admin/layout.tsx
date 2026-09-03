import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import AdminTabs from "./AdminTabs";

export const metadata = { title: "Admin — CQG Portal" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    await requireAdmin();

    return (
        <div className="portal-shell">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                    <span className="eyebrow text-pink-deep mb-2 block">CQG Admin</span>
                    <h1 className="font-display font-extrabold text-2xl text-navy">Admin Dashboard</h1>
                </div>
                <Link href="/portal/dashboard" className="btn-cqg btn-outline-navy btn-sm">
                    Back to my dashboard
                </Link>
            </div>
            <AdminTabs />
            {children}
        </div>
    );
}
