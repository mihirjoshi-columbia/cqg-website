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
    "Mihir Joshi": "Headlands",
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
