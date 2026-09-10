"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { useAuth } from "@/components/auth/AuthProvider";

const navLinks: { name: string; href: string; children?: { name: string; href: string }[] }[] = [
  { name: "Home", href: "/" },
  {
    name: "Membership",
    href: "/recruitment",
    children: [
      { name: "Apply", href: "/recruitment" },
      { name: "Program", href: "/education" },
      { name: "Current Members", href: "/members" },
    ],
  },
  { name: "Events", href: "/events" },
  { name: "Competition", href: "/competition" },
  { name: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading, portalKind } = useAuth();

  const dashboardHref =
    portalKind === "cqg" ? "/portal/dashboard" : portalKind === "cutc" ? "/cutc/apply/dashboard" : null;
  const showDashboardLink = Boolean(user) && !loading && Boolean(dashboardHref);

  return (
    <nav className="fixed w-full z-50 bg-white/92 backdrop-blur-md border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          <Link href="/" className="flex items-center gap-2.5 flex-none">
            <Image
              src="/logo-navy.svg"
              alt="Columbia Quant Group"
              width={120}
              height={45}
              className="h-7 w-auto object-contain"
              priority
            />
            <span className="hidden md:inline font-sans font-semibold text-[0.88rem] text-navy whitespace-nowrap">
              COLUMBIA QUANT GROUP
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6 whitespace-nowrap min-w-0">
            {navLinks.map((link) => {
              const current =
                pathname === link.href || (link.children?.some((c) => c.href === pathname) ?? false);

              if (link.children) {
                return (
                  <div key={link.name} className="relative group flex-none">
                    <button
                      type="button"
                      className={clsx(
                        "flex items-center gap-1 text-[0.88rem] font-semibold transition-colors duration-200",
                        current ? "text-sky-deep" : "text-ink-soft hover:text-navy"
                      )}
                    >
                      {link.name}
                      <ChevronDown size={14} className="mt-px" />
                    </button>
                    <div className="absolute left-0 top-full pt-3 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-150">
                      <div className="bg-white border border-line shadow-lg min-w-[180px] py-1.5">
                        {link.children.map((child) => {
                          const childCurrent = pathname === child.href;
                          return (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={clsx(
                                "block px-4 py-2 text-[0.85rem] font-semibold whitespace-nowrap",
                                childCurrent ? "text-sky-deep" : "text-ink-soft hover:text-navy hover:bg-paper-alt"
                              )}
                            >
                              {child.name}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={clsx(
                    "text-[0.88rem] font-semibold transition-colors duration-200 flex-none",
                    current ? "text-sky-deep" : "text-ink-soft hover:text-navy"
                  )}
                >
                  {link.name}
                </Link>
              );
            })}

            {showDashboardLink ? (
              <Link href={dashboardHref!} className="btn-cqg btn-outline-navy btn-sm flex-none">
                Dashboard
              </Link>
            ) : (
              <div className="relative group flex-none">
                <button
                  type="button"
                  className="btn-cqg btn-outline-navy btn-sm flex items-center gap-1"
                >
                  Log In
                  <ChevronDown size={14} className="mt-px" />
                </button>
                <div className="absolute right-0 top-full pt-3 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-150">
                  <div className="bg-white border border-line shadow-lg min-w-[180px] py-1.5">
                    <Link
                      href="/portal/login"
                      className="block px-4 py-2 text-[0.85rem] font-semibold whitespace-nowrap text-ink-soft hover:text-navy hover:bg-paper-alt"
                    >
                      CQG Portal
                    </Link>
                    <Link
                      href="/cutc/apply/login"
                      className="block px-4 py-2 text-[0.85rem] font-semibold whitespace-nowrap text-ink-soft hover:text-navy hover:bg-paper-alt"
                    >
                      CUTC
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-ink-soft hover:text-navy focus:outline-none"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-line overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => {
                const current =
                  pathname === link.href || (link.children?.some((c) => c.href === pathname) ?? false);

                if (link.children) {
                  return (
                    <div key={link.name}>
                      <div
                        className={clsx(
                          "px-3 py-2 text-base font-semibold",
                          current ? "text-sky-deep" : "text-ink-soft"
                        )}
                      >
                        {link.name}
                      </div>
                      {link.children.map((child) => {
                        const childCurrent = pathname === child.href;
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            onClick={() => setIsOpen(false)}
                            className={clsx(
                              "block px-6 py-2 text-[0.95rem] font-semibold",
                              childCurrent ? "text-sky-deep" : "text-ink-soft hover:text-navy hover:bg-paper-alt"
                            )}
                          >
                            {child.name}
                          </Link>
                        );
                      })}
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={clsx(
                      "block px-3 py-2 text-base font-semibold",
                      current ? "text-sky-deep" : "text-ink-soft hover:text-navy hover:bg-paper-alt"
                    )}
                  >
                    {link.name}
                  </Link>
                );
              })}

              <div className="border-t border-line mt-2 pt-2">
                {showDashboardLink ? (
                  <Link
                    href={dashboardHref!}
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 text-base font-semibold text-ink-soft hover:text-navy hover:bg-paper-alt"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <div className="px-3 py-2 text-base font-semibold text-ink-soft">Log In</div>
                    <Link
                      href="/portal/login"
                      onClick={() => setIsOpen(false)}
                      className="block px-6 py-2 text-[0.95rem] font-semibold text-ink-soft hover:text-navy hover:bg-paper-alt"
                    >
                      CQG Portal
                    </Link>
                    <Link
                      href="/cutc/apply/login"
                      onClick={() => setIsOpen(false)}
                      className="block px-6 py-2 text-[0.95rem] font-semibold text-ink-soft hover:text-navy hover:bg-paper-alt"
                    >
                      CUTC
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
