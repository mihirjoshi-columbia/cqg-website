import { currentMembers, exec2025, seniorAdvisors } from "@/lib/data/members";

// One row per little -> big. Names must match the rosters in lib/data/members.ts.
// To add another generation later, add rows whose little is an existing big.
export const bigLittlePairs: { little: string; big: string }[] = [
    { little: "Jinghe Zhang", big: "Aurora Wang" },
    { little: "Lisa Liu", big: "Aurora Wang" },
    { little: "Michelle Zhou", big: "Harris Chen" },
    { little: "Alexandra Duan", big: "Harris Chen" },
    { little: "Anay Garodia", big: "Kshitig Seth" },
    { little: "Ethan Badner", big: "Kshitig Seth" },
    { little: "Dylan Fei", big: "Luke Freed" },
    { little: "Shreyas Singh", big: "Luke Freed" },
    { little: "Zachary Jeon", big: "Mihir Joshi" },
    { little: "Ryan Kim", big: "Mihir Joshi" },
    { little: "Evelyn Li", big: "Nicole Pi" },
    { little: "Siddharth Rout", big: "Nicole Pi" },
    { little: "Raymond Zhao", big: "Nikhil Mudumbi" },
    { little: "Frank Liang", big: "Nikhil Mudumbi" },
    { little: "Kevin Lu", big: "Nikhil Mudumbi" },
    { little: "Ivy Hu", big: "Shobini Iyer" },
    { little: "Keona Tang", big: "Shobini Iyer" },
    { little: "Ethan Schales", big: "Shriya Mahakala" },
    { little: "Olivia Huang", big: "Shriya Mahakala" },
    { little: "Dylan Sparrow", big: "Steven Spasov" },
    { little: "Victor Robila", big: "Steven Spasov" },
];

const linkedinByName = new Map(
    [...currentMembers, ...seniorAdvisors, ...exec2025].map((p) => [p.name, p.linkedin] as const)
);

export interface LineageFamily {
    big: { name: string; linkedin?: string };
    littles: { name: string; linkedin?: string }[];
}

const person = (name: string) => ({ name, linkedin: linkedinByName.get(name) });

export const lineageFamilies: LineageFamily[] = [...new Set(bigLittlePairs.map((p) => p.big))]
    .sort((a, b) => a.localeCompare(b))
    .map((big) => ({
        big: person(big),
        littles: bigLittlePairs
            .filter((p) => p.big === big)
            .map((p) => person(p.little))
            .sort((a, b) => a.name.localeCompare(b.name)),
    }));
