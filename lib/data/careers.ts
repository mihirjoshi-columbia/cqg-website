// Where people interned and where they started full-time, keyed by the name used
// on the site. Shown as a colored line under the person's name wherever they
// appear (Members page and the Education lineage graph).
//
// Internship: the firm they interned at. Full-time: their first role after graduating (a job, or a PhD).

export const internshipByName: Record<string, string> = {
    "Case Schemmer": "Citadel Securities",
    "Dylan Fei": "Millennium",
    "Harris Chen": "Optiver",
    "Leo Sun": "Optiver",
    "Nikas Lukyanov": "Citadel Securities",
    "Rohan Timmaraju": "Citadel GQS",
    "Shobini Iyer": "Google",
    "Shriya Mahakala": "Jane Street",
    "Aurora Wang": "IMC",
    "Nikhil Mudumbi": "Jane Street",
    "Kshitig Seth": "Amazon",
    "Steven Spasov": "Jane Street",
    "Victor Robila": "Bridgewater",
};

export const fullTimeByName: Record<string, string> = {
    "Thomas Chen": "PhD at Stanford",
    "Karina Dovgodko": "PhD at Brown",
    "Oliver Jin Wang": "PhD at Columbia",
    "Connor Goggins": "Uber",
    "Frank Ruta": "Optiver",
    "HJ Hong": "Bridge Investment Group",
    "Alison Wu": "Goldman Sachs",
    "Brian Daley": "Susquehanna",
    "Akash Kumar": "Goldman Sachs",
    "Allison Lin": "Centerview Partners",
    "David Chang": "Amazon",
    "Matthew Weng": "Goldman Sachs",
    "Navia Zhang": "Blackstone",
    "Rahul Ram": "Meta",
    "Rishi Kosna": "Jane Street",
    "Rohan Ghotra": "Five Rings",
    "Lauren Lee": "Citi",
    "Yang Hsu": "Morgan Stanley",
    "Michelle Lu": "IMC",
    "Zach Geddes": "Wayfair",
    "Aryan Jain": "Google",
    "Chris Chang": "Goldman Sachs",
    "Iman Anwarzai": "Meta",
    "William Vietor": "Citadel Securities",
    "Collin Wang": "Jane Street",
    "Joseph O'Connor": "Minimap",
    "Mikhaela Diaz": "Morgan Stanley",
    "Thomas Tran": "IMC",
    "Manvir Bhandal": "Compass Lexecon",
    "Anthony Ma": "Oak Hill Advisors",
    "Eduardo Liam Santa Cruz": "Morgan Stanley",
    "Kevin Jiang": "Google",
    "Jesse Zhong": "Two Sigma",
    "Alex Chung": "Teachers' Retirement System of Illinois",
    "Erinn Sun": "Quantedge",
    "Luyun Lin": "Citi",
    "Roshun Sunder": "Bloomberg",
    "Zhaoyang Liu": "CME Group",
    "Jack Briody": "JEK Communications",
    "Jeffrey Huang": "Abbott",
    "Gleb Vizitiv": "Morgan Stanley",
    "Felipe Grabowsky": "Meta",
    "Mikaela Zhang": "Goldman Sachs",
    "Nicolae Lari": "Microsoft",
    "Rodolfo Raimundo": "Next Caller (Pindrop)",
    "Thomas Chadrycki": "Google",
    "Nico Winata": "Morgan Stanley",
    "Eric Yuan": "J.P. Morgan",
    "Eilam Lehrman": "TD Securities",
    "Eric Wu": "Two Sigma",
    "Michael Grandel": "Microsoft",
    "Victoria (Yiran) Zhou": "Ping An Asset Management",
    "Ashley Seo": "IMC",
    "Ben Proothi": "Jane Street",
    "Derek Che": "Citadel Securities",
    "Johnathan Mo": "Susquehanna",
    "Luke Freed": "Bridgewater",
    "Nicole Pi": "DRW",
    "Mihir Joshi": "Headlands Tech",
};

export interface Career {
    internship?: string;
    fullTime?: string;
}

export const careerOf = (name: string): Career => ({
    internship: internshipByName[name],
    fullTime: fullTimeByName[name],
});

export const withCareer = <T extends { name: string }>(people: T[]): (T & Career)[] =>
    people.map((p) => ({ ...p, ...careerOf(p.name) }));

/** How many career lines the person shows (0-2). */
export const careerLineCount = (c: Career) => (c.internship ? 1 : 0) + (c.fullTime ? 1 : 0);

// Industry for each company, used to group small companies in the treemap on the
// Members page. A company missing here falls under "Other".
export const industryByCompany: Record<string, string> = {
    // Trading & quant
    "Citadel Securities": "Trading & quant firms",
    "DRW": "Trading & quant firms",
    "Five Rings": "Trading & quant firms",
    "Headlands Tech": "Trading & quant firms",
    "IMC": "Trading & quant firms",
    "Jane Street": "Trading & quant firms",
    "Optiver": "Trading & quant firms",
    "Susquehanna": "Trading & quant firms",
    "Two Sigma": "Trading & quant firms",
    // Tech
    "Amazon": "Tech",
    "Bloomberg": "Tech",
    "Google": "Tech",
    "Meta": "Tech",
    "Microsoft": "Tech",
    "Minimap": "Tech",
    "Next Caller (Pindrop)": "Tech",
    "Uber": "Tech",
    "Wayfair": "Tech",
    // Banks
    "Centerview Partners": "Banks",
    "Citi": "Banks",
    "Goldman Sachs": "Banks",
    "J.P. Morgan": "Banks",
    "Morgan Stanley": "Banks",
    "TD Securities": "Banks",
    // Investing & asset management
    "Blackstone": "Investing & asset management",
    "Bridge Investment Group": "Investing & asset management",
    "Bridgewater": "Investing & asset management",
    "Oak Hill Advisors": "Investing & asset management",
    "Ping An Asset Management": "Investing & asset management",
    "Quantedge": "Investing & asset management",
    "Teachers' Retirement System of Illinois": "Investing & asset management",
};

/** A company with at least this many people gets its own box; smaller ones are grouped by industry. */
export const OWN_BOX_MIN_PEOPLE = 2;

export interface TreemapBox {
    key: string;
    label: string;
    /** "company" = one company; "industry" = several small companies grouped together; "phd" = everyone who started a PhD. */
    kind: "company" | "industry" | "phd";
    /** Everyone in the box, with the company (or school, for PhDs) they started at. */
    people: { name: string; company: string }[];
    value: number;
}

/**
 * First roles for the treemap, biggest first. Companies with OWN_BOX_MIN_PEOPLE or more
 * people get a box; the rest are grouped by industry, so a company moves out of its
 * industry box automatically once enough people list it. Anyone whose role starts with
 * "PhD" goes in one PhD box, however many there are.
 */
export function fullTimeBoxes(): { boxes: TreemapBox[]; peopleCount: number; companyCount: number } {
    const byCompany = new Map<string, string[]>();
    const phds: { name: string; company: string }[] = [];
    for (const [name, role] of Object.entries(fullTimeByName)) {
        if (role.startsWith("PhD")) {
            phds.push({ name, company: role.replace(/^PhD( at)?\s*/, "") });
            continue;
        }
        byCompany.set(role, [...(byCompany.get(role) ?? []), name]);
    }

    const boxes: TreemapBox[] = [];
    const byIndustry = new Map<string, TreemapBox>();
    for (const [company, names] of byCompany) {
        const people = names.sort().map((name) => ({ name, company }));
        if (names.length >= OWN_BOX_MIN_PEOPLE) {
            boxes.push({ key: company, label: company, kind: "company", people, value: people.length });
            continue;
        }
        const industry = industryByCompany[company] ?? "Other";
        const box = byIndustry.get(industry) ?? { key: industry, label: industry, kind: "industry" as const, people: [], value: 0 };
        box.people.push(...people);
        box.value = box.people.length;
        byIndustry.set(industry, box);
    }
    boxes.push(...byIndustry.values());
    if (phds.length) {
        boxes.push({ key: "PhD", label: "PhD", kind: "phd", people: phds.sort((a, b) => a.name.localeCompare(b.name)), value: phds.length });
    }
    for (const box of byIndustry.values()) box.people.sort((a, b) => a.company.localeCompare(b.company));

    boxes.sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
    return {
        boxes,
        peopleCount: [...byCompany.values()].reduce((n, names) => n + names.length, phds.length),
        companyCount: byCompany.size,
    };
}
