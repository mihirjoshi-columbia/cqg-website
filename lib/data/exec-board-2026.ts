export interface Exec {
    name: string;
    role: string;
    image: string;
    linkedin: string;
    major: string;
    interests: string;
    summer: string;
    previous: string;
    /** Manual per-photo tuning so heads read at a roughly consistent size/position — source photos vary a lot in framing. */
    photoPosition: string;
    photoScale: number;
}

export const execBoard2026: Exec[] = [
    {
        name: "Aurora Wang",
        role: "President",
        image: "/team/aurora.jpeg",
        linkedin: "https://www.linkedin.com/in/aurorawang15/",
        major: "Computer Science (SEAS)",
        interests: "Quant modeling, fixed income, econ policy, NLP",
        summer: "IMC — Quant Trading Intern",
        previous: "Weiss Asset Management",
        photoPosition: "50% 18%",
        photoScale: 1,
    },
    {
        name: "Nicole Pi",
        role: "External VP",
        image: "/team/nicole.jpg",
        linkedin: "https://www.linkedin.com/in/nicoleipi/",
        major: "Computer Science (SEAS)",
        interests: "Statistical modeling & ML, responsible AI",
        summer: "DRW — Quant Trading Intern",
        previous: "SpaceX, Goldman Sachs",
        photoPosition: "48% 4%",
        photoScale: 1.15,
    },
    {
        name: "Victor Robila",
        role: "Internal VP",
        image: "/team/victor.jpeg",
        linkedin: "https://www.linkedin.com/in/victor-robila/",
        major: "Computer Science & Mathematics",
        interests: "Systematic strategies, mispricing",
        summer: "Bridgewater — Investment Engineer Intern",
        previous: "Gilder Gagnon Howe, private equity",
        photoPosition: "48% 14%",
        photoScale: 1.05,
    },
    {
        name: "Mihir Joshi",
        role: "Co-Head of Education",
        image: "/team/mihir.jpeg",
        linkedin: "https://www.linkedin.com/in/mihirjoshi-columbia/",
        major: "Computer Science (SEAS)",
        interests: "Low-latency systems, computer architecture",
        summer: "Chicago Trading Company — Quant Trading Intern",
        previous: "CFO, Lion Fund LLC",
        photoPosition: "50% 8%",
        photoScale: 1,
    },
    {
        name: "Nikhil Mudumbi",
        role: "Co-Head of Education",
        image: "/team/nikhil.jpeg",
        linkedin: "https://www.linkedin.com/in/nikhil-mudumbi-614b17247/",
        major: "Mathematics",
        interests: "Analysis & probability, stochastics",
        summer: "Math research at Columbia",
        previous: "Jane Street — Trading Intern",
        photoPosition: "50% 10%",
        photoScale: 1.05,
    },
    {
        name: "Ivy Hu",
        role: "Marketing & Communications Chair",
        image: "/team/ivy.jpg",
        linkedin: "https://www.linkedin.com/in/ivy-hu-ab8577342/",
        major: "Physics & Computer Science",
        interests: "Quantitative modeling, quantum computing",
        summer: "NASA — ML Researcher (LISA project)",
        previous: "Plasma & astrophysics research",
        photoPosition: "50% 6%",
        photoScale: 1,
    },
];
