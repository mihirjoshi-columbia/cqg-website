import { type ReactNode } from "react";
import AdvisorList from "@/components/team/AdvisorList";
import ExecBoard from "@/components/team/ExecBoard";
import TeamList from "@/components/team/TeamList";
import FirmsCollage from "@/components/placements/FirmsCollage";
import CareerTreemap from "@/components/placements/CareerTreemap";
import { currentMembers, seniorAdvisors, seniorMembers2627, exec2025 } from "@/lib/data/members";
import { withCareer } from "@/lib/data/careers";
import { pastBoards, type PastBoard } from "@/lib/data/past-boards";
import { execBoard2026 } from "@/lib/data/exec-board-2026";
import { firstYearByName, markFirstYear } from "@/lib/first-year";

// Continuing from the 2025-26 underclassmen into 2026-27 as underclassmen.
// (Dylan Fei, Dylan Sparrow, Shreyas Singh, Sindhu Chalasani, Alexandra Duan and Harry Zhang moved up to 2026-27 Senior Members; Olivia Huang is not continuing.)
const underclassmen2627Names = [
    "Michelle Zhou",
    "Zachary Jeon",
    "Ethan Badner",
    "Anay Garodia",
    "Keona Tang",
    "Evelyn Li",
    "Siddharth Rout",
    "Ethan Schales",
    "Cathy Deng",
    "Ryan Kim",
    "Lisa Liu",
];
const newUnderclassmen2627 = [
    { name: "Ana-Maria Petcu", linkedin: "https://www.linkedin.com/in/anapetcu" },
    { name: "Carlos Sarkis", linkedin: "https://www.linkedin.com/in/carlossarkis" },
    { name: "Emily Jo", linkedin: "https://www.linkedin.com/in/emily-jo-b41565265" },
    { name: "Ethan Lu" },
    { name: "Jason Xiao", linkedin: "https://www.linkedin.com/in/yuhao7xiao" },
    { name: "Kevin Dong" },
    { name: "Leandro Zhang", linkedin: "https://www.linkedin.com/in/leandro-zhang-8b3373348" },
    { name: "Luke Meng", linkedin: "https://www.linkedin.com/in/luke-meng-00ab5531a" },
    { name: "Michael Zhu" },
    { name: "Nathan Zhang", linkedin: "https://www.linkedin.com/in/nathan-zhang-22217b368" },
    { name: "Petewat Chaoha", linkedin: "https://www.linkedin.com/in/petewat-chaoha-9849b8343" },
    { name: "Ryan Shanbhag", linkedin: "https://www.linkedin.com/in/ryan-shanbhag-11490a207" },
    { name: "Sasha Martynov", linkedin: "https://www.linkedin.com/in/aleksandr-martynov-2b696a428" },
    { name: "Sidharth Sharma", linkedin: "https://www.linkedin.com/in/sidharth-sharma-38134a2aa" },
    { name: "Sophia Tang", linkedin: "https://www.linkedin.com/in/tang-sophia" },
    { name: "Tanish Sonone", linkedin: "https://www.linkedin.com/in/tanishsonone" },
    { name: "Warren Fu", linkedin: "https://www.linkedin.com/in/warren-fu-2554a6267" },
];

const underclassmen2627 = [
    ...currentMembers.filter((m) => underclassmen2627Names.includes(m.name)),
    ...newUnderclassmen2627,
];

const exec2024 = [
    { name: "Brian Daley", tag: "Co-President", linkedin: "https://www.linkedin.com/in/briandaley24/" },
    { name: "Akash Kumar", tag: "Co-President", linkedin: "https://www.linkedin.com/in/akash-kumar-86083022b/" },
];

const exec2023 = [
    { name: "Brian Daley", tag: "Co-President", linkedin: "https://www.linkedin.com/in/briandaley24/" },
    { name: "Akash Kumar", tag: "Co-President", linkedin: "https://www.linkedin.com/in/akash-kumar-86083022b/" },
];

const members2425 = [
    { name: "Alison Wu", linkedin: "https://www.linkedin.com/in/alison-wu-8387961b5/" },
    { name: "Aurora Wang", linkedin: "https://www.linkedin.com/in/aurorawang15/" },
    { name: "Nikhil Mudumbi", linkedin: "https://www.linkedin.com/in/nikhil-mudumbi-614b17247/" },
    { name: "Brianna Wang", linkedin: "https://www.linkedin.com/in/brianna-wang-9b674b287/" },
    { name: "Ben Proothi", linkedin: "https://www.linkedin.com/in/bp2715/" },
    { name: "Luke Early", linkedin: "https://www.linkedin.com/in/lukeearly/" },
    { name: "Aryaman Rakhecha", linkedin: "https://www.linkedin.com/in/aryaman-rakhecha/" },
    { name: "Srirag Tatavarti", linkedin: "https://www.linkedin.com/in/srirag-tatavarti/" },
    { name: "Julia Ding", linkedin: "https://www.linkedin.com/in/julialding/" },
];

const members2324 = [
    { name: "Matthew Weng", linkedin: "https://www.linkedin.com/in/matthewweng/" },
    { name: "Rishi Kosna", linkedin: "https://www.linkedin.com/in/rishi-kosna-7a94a8263/" },
    { name: "Navia Zhang", linkedin: "https://www.linkedin.com/in/navia-zhang/" },
    { name: "David Chang", linkedin: "https://www.linkedin.com/in/davidzhuchang/" },
    { name: "Rahul Ram", linkedin: "https://www.linkedin.com/in/rahulram1064/" },
    { name: "Alison Wu", linkedin: "https://www.linkedin.com/in/alison-wu-8387961b5/" },
    { name: "Allison Lin", linkedin: "https://www.linkedin.com/in/yun-tzu-allison-lin/" },
    { name: "Rohan Ghotra", linkedin: "https://www.linkedin.com/in/rohan-ghotra/" },
];

function BoardSection({ title, gray = false, children }: { title: string; gray?: boolean; children: ReactNode }) {
    return (
        <section className={`${gray ? "bg-paper-alt " : ""}py-16`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="font-display font-extrabold text-2xl text-navy mb-8">{title}</h2>
                {children}
            </div>
        </section>
    );
}

// Fall 2024 and older: one block per board, newest first.
const boards: PastBoard[] = [
    { label: "Fall 2024", year: 2024, exec: exec2024, junior: members2425 },
    { label: "AY 2023–2024", year: 2023, exec: exec2023, junior: members2324 },
    ...pastBoards,
];

const namesOf = (people: { name: string }[]) => people.map((p) => p.name);
const firstYears = firstYearByName(
    [
        { year: 2026, names: [...namesOf(execBoard2026), ...namesOf(seniorMembers2627), ...namesOf(underclassmen2627)] },
        { year: 2025, names: [...namesOf(exec2025), ...namesOf(seniorAdvisors), ...namesOf(currentMembers)] },
        ...boards.map((b) => ({ year: b.year, names: [...namesOf(b.exec), ...namesOf(b.junior)] })),
    ]
);
const mark = <T extends { name: string }>(people: T[], year: number) =>
    withCareer(markFirstYear(people, year, firstYears));

export default function MembersPage() {
    return (
        <div className="min-h-screen bg-white">
            <section className="bg-navy relative overflow-hidden py-14 sm:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <span className="tag tag-lime mb-2 block w-fit">Internal Membership &middot; Members</span>
                    <div className="chevron chevron-sky mb-4">Members</div>
                    <p className="text-[#C3D2EA] text-[1.05rem] lg:whitespace-nowrap">
                        Meet the dedicated students and alumni who make up the Columbia Quant Group.
                    </p>
                </div>
            </section>

            <FirmsCollage aside={<CareerTreemap />} />
            <section className="bg-navy py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
                    <p className="text-[#C3D2EA] text-[1.05rem] leading-relaxed max-w-3xl">
                        Internal members are selected every academic year; the executive board is elected to
                        serve each calendar year.
                    </p>
                    <p className="text-sm mt-5 flex flex-wrap gap-x-6 gap-y-1">
                        <span className="text-[#C3D2EA]">* First year in CQG</span>
                        <span className="career-intern-dark">&#9679; Internship</span>
                        <span className="career-fulltime-dark">&#9679; First role after graduating</span>
                    </p>
                </div>
            </section>
            <ExecBoard firstYearNames={namesOf(execBoard2026).filter((n) => firstYears.get(n) === 2026)} />
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="font-display font-extrabold text-2xl text-navy mb-8">AY 2026–2027 Internal Members</h2>
                    <div className="space-y-10">
                        <AdvisorList title="Senior Members" advisors={mark(seniorMembers2627, 2026)} />
                        <TeamList title="Underclassmen" members={mark(underclassmen2627, 2026)} />
                    </div>
                </div>
            </section>
            <section className="bg-paper-alt py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="font-display font-extrabold text-2xl text-navy mb-8">2025 Executive Board</h2>
                    <AdvisorList advisors={mark(exec2025, 2025)} byRole />
                </div>
            </section>
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="font-display font-extrabold text-2xl text-navy mb-8">AY 2025–2026 Internal Members</h2>
                    <div className="space-y-10">
                        <AdvisorList title="Senior Members" advisors={mark(seniorAdvisors, 2025)} />
                        <TeamList title="Underclassmen" members={mark(currentMembers, 2025)} />
                    </div>
                </div>
            </section>
            <section className="bg-navy py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="eyebrow text-sky mb-3">A New Structure</div>
                    <p className="text-[#C3D2EA] text-[1.05rem] leading-relaxed max-w-3xl">
                        In Spring 2025, CQG moved to an executive board elected to serve each calendar year and
                        created Internal Membership, which is selected every academic year. Before this, an
                        executive board and a junior e-board were elected for the academic year.
                    </p>
                </div>
            </section>
            {boards.map((board, i) => (
                <BoardSection key={board.label} gray={i % 2 === 0} title={board.label}>
                    <div className="space-y-10">
                        <AdvisorList
                            title="Executive Board"
                            advisors={mark(board.exec, board.year)}
                            byRole
                            thenByName={board.year < 2023}
                        />
                        <TeamList title="Junior E-Board" members={mark(board.junior, board.year)} />
                    </div>
                </BoardSection>
            ))}
        </div>
    );
}
