export type SponsorTier = "gold" | "silver" | "bronze";

export interface Sponsor {
    name: string;
    /** Path under /public. White-on-transparent artwork: the tier grid renders on navy. */
    logo: string;
    url: string;
}

export interface Partner {
    name: string;
    /** What the partner contributes, shown as the card's eyebrow. */
    role: string;
    blurb: string;
    url: string;
    /** Dark-on-transparent artwork for the white partners section. Omit to render the name as a wordmark. */
    logo?: string;
}

export const SPONSOR_YEAR = "2026–2027";

export const sponsorTiers: { tier: SponsorTier; label: string; sponsors: Sponsor[] }[] = [
    {
        tier: "gold",
        label: "Gold",
        sponsors: [
            { name: "SIG / Susquehanna", logo: "/logos/sig-h-white.png", url: "https://sig.com" },
            { name: "Seven Research", logo: "/logos/seven-research-white.svg", url: "https://sevenresearch.com" },
            { name: "Goldman Sachs", logo: "/logos/goldman-sachs-white.png", url: "https://www.goldmansachs.com" },
        ],
    },
    {
        tier: "silver",
        label: "Silver",
        sponsors: [
            { name: "Hudson River Trading", logo: "/logos/hrt-h-white.png?v=2", url: "https://www.hudsonrivertrading.com" },
            { name: "Five Rings", logo: "/logos/five-rings-full-white.png", url: "https://fiverings.com" },
            { name: "DRW", logo: "/logos/drw-white.png", url: "https://drw.com" },
            { name: "Citadel Securities", logo: "/logos/citadel-securities-h-white.png", url: "https://www.citadelsecurities.com" },
            { name: "Old Mission Capital", logo: "/logos/old-mission-capital-white.png", url: "https://www.oldmissioncapital.com" },
            { name: "Wintermute", logo: "/logos/wintermute-white.svg", url: "https://www.wintermute.com" },
        ],
    },
    {
        tier: "bronze",
        label: "Bronze",
        sponsors: [
            { name: "Jane Street", logo: "/logos/jane-street-h-white.png", url: "https://www.janestreet.com" },
            { name: "All Options USA", logo: "/logos/all-options-white.png", url: "https://www.alloptions.nl" },
            { name: "Walleye Capital", logo: "/logos/walleye-white.png", url: "https://www.walleyecapital.com" },
        ],
    },
];

export const partners: Partner[] = [
    {
        name: "Tradermath",
        role: "Presenting sponsor & platform partner",
        blurb: "Trading-interview prep platform: mental math drills, market-making games, and firm-specific assessments.",
        url: "https://www.tradermath.org",
        logo: "/logos/tradermath.png",
    },
    {
        name: "Columbia IEOR",
        role: "In-kind sponsor · Meals",
        blurb: "Columbia Engineering's Department of Industrial Engineering and Operations Research provides meals for CQG events.",
        url: "https://ieor.columbia.edu",
        logo: "/logos/columbia-ieor.png",
    },
];
