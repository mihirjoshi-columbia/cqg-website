import AdvisorList from "@/components/team/AdvisorList";
import ExecBoard from "@/components/team/ExecBoard";
import TeamList from "@/components/team/TeamList";
import FirmsCollage from "@/components/placements/FirmsCollage";
import { execBoard2026 } from "@/lib/data/exec-board-2026";
import { firstYearByName, markFirstYear } from "@/lib/first-year";

const currentMembers = [
    { name: "Michelle Zhou", linkedin: "https://www.linkedin.com/in/michelle-zhou-252119348" },
    { name: "Zachary Jeon", linkedin: "https://www.linkedin.com/in/zachary-jeon/" },
    { name: "Ethan Badner", linkedin: "https://www.linkedin.com/in/ethan-badner-133a29321" },
    { name: "Anay Garodia", linkedin: "https://www.linkedin.com/in/anay-garodia-a863a6257/" },
    { name: "Dylan Fei", linkedin: "http://www.linkedin.com/in/dylan-fei-067247313" },
    { name: "Dylan Sparrow", linkedin: "https://www.linkedin.com/in/dylan-sparrow-24997638a" },
    { name: "Keona Tang", linkedin: "https://www.linkedin.com/in/keonatang/" },
    { name: "Evelyn Li", linkedin: "https://www.linkedin.com/in/evelynlicolumbia" },
    { name: "Olivia Huang", linkedin: "https://www.linkedin.com/in/olivia-huang-a13690244/" },
    { name: "Siddharth Rout", linkedin: "https://www.linkedin.com/in/siddharth-rout-69a0191b9" },
    { name: "Ethan Schales", linkedin: "https://www.linkedin.com/in/ethan41sch" },
    { name: "Cathy Deng", linkedin: "https://www.linkedin.com/in/cathy-deng/" },
    { name: "Victor Robila", linkedin: "https://www.linkedin.com/in/victor-robila/" },
    { name: "Ivy Hu", linkedin: "https://www.linkedin.com/in/ivy-hu-ab8577342/" },
    { name: "Shreyas Singh", linkedin: "https://www.linkedin.com/in/shreyas-singh1/" },
    { name: "Lisa Liu", linkedin: "https://www.linkedin.com/in/lisa-liu-2891a62b7/" },
    { name: "Sindhu Chalasani", linkedin: "https://www.linkedin.com/in/sindhu-chalasani/" },
    { name: "Raymond Zhao", linkedin: "https://www.linkedin.com/in/raymond-a-zhao/" },
    { name: "Kevin Lu", linkedin: "https://www.linkedin.com/in/kevin-lu7/" },
    { name: "Jinghe Zhang", linkedin: "https://www.linkedin.com/in/jinghe-zhang/" },
    { name: "Alexandra Duan", linkedin: "https://www.linkedin.com/in/alexandra-duan/" },
    { name: "Ryan Kim", linkedin: "https://www.linkedin.com/in/ryjikim/" },
    { name: "Frank Liang", linkedin: "https://www.linkedin.com/in/jia-hao-liang-647144349/" },
];

// Continuing from the 2025-26 underclassmen into 2026-27 as underclassmen.
// (Dylan Fei and Dylan Sparrow moved up to 2026-27 Senior Members; Olivia Huang is not continuing.)
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

const seniorAdvisors = [
    { name: "Shriya Mahakala", tag: "Jane Street", linkedin: "https://www.linkedin.com/in/shriya-mahakala/" },
    { name: "Kshitig Seth", tag: "Amazon", linkedin: "https://www.linkedin.com/in/kshitig-seth/" },
    { name: "Shobini Iyer", tag: "Google", linkedin: "https://www.linkedin.com/in/shobini-iyer/" },
    { name: "Steven Spasov", tag: "Jane Street", linkedin: "https://www.linkedin.com/in/steven-spasov-24bb43257/" },
    { name: "Luke Freed", tag: "Bridgewater", linkedin: "https://www.linkedin.com/in/lukefreed/" },
    { name: "Harris Chen", tag: "Optiver", linkedin: "https://www.linkedin.com/in/harrischen-/" },
    { name: "Derek Che", tag: "Citadel Securities", linkedin: "https://www.linkedin.com/in/yuyao-c-379a71290/" },
    { name: "Nicole Pi", tag: "DRW", linkedin: "https://www.linkedin.com/in/nicoleipi/" },
    { name: "Mihir Joshi", tag: "CTC", linkedin: "https://www.linkedin.com/in/mihirjoshi-columbia/" },
];

const seniorMembers2627 = [
    { name: "Ashley Seo", tag: "IMC", linkedin: "https://www.linkedin.com/in/ashley-seo/" },
    { name: "Shriya Mahakala", tag: "Jane Street", linkedin: "https://www.linkedin.com/in/shriya-mahakala/" },
    { name: "Derek Che", tag: "Citadel Securities", linkedin: "https://www.linkedin.com/in/yuyao-c-379a71290/" },
    { name: "Harris Chen", tag: "Prev. Optiver", linkedin: "https://www.linkedin.com/in/harrischen-/" },
    { name: "Johnathan Mo", tag: "SIG", linkedin: "https://www.linkedin.com/in/johnathan-mo/" },
    { name: "Srirag Tatavarti", linkedin: "https://www.linkedin.com/in/srirag-tatavarti/" },
    { name: "Rohan Timmaraju", tag: "Citadel GQS", linkedin: "https://www.linkedin.com/in/rohan-timmaraju/" },
    { name: "Shobini Iyer", tag: "Google", linkedin: "https://www.linkedin.com/in/shobini-iyer/" },
    { name: "Nikas Lukyanov", tag: "Citadel Securities", linkedin: "https://www.linkedin.com/in/nikaslukyanov/" },
    { name: "Luke Freed", tag: "Bridgewater", linkedin: "https://www.linkedin.com/in/lukefreed/" },
    { name: "Leo Sun", tag: "Prev. Optiver", linkedin: "https://www.linkedin.com/in/leoysun/" },
    { name: "Case Schemmer", tag: "Prev. Citadel Securities", linkedin: "https://www.linkedin.com/in/case-schemmer/" },
    { name: "Shreyas Singh", linkedin: "https://www.linkedin.com/in/shreyas-singh1/" },
    { name: "Dylan Fei", tag: "Millennium", linkedin: "http://www.linkedin.com/in/dylan-fei-067247313" },
    { name: "Dylan Sparrow", linkedin: "https://www.linkedin.com/in/dylan-sparrow-24997638a" },
];

const exec2025 = [
    { name: "Ben Proothi", tag: "President", linkedin: "https://www.linkedin.com/in/bp2715/" },
    { name: "Aryaman Rakhecha", tag: "External VP", linkedin: "https://www.linkedin.com/in/aryaman-rakhecha/" },
    { name: "Srirag Tatavarti", tag: "Internal VP", linkedin: "https://www.linkedin.com/in/srirag-tatavarti/" },
    { name: "Alison Wu", tag: "Marketing & Communications Chair", linkedin: "https://www.linkedin.com/in/alison-wu-8387961b5/" },
    { name: "Aurora Wang", tag: "Co-Head of Education", linkedin: "https://www.linkedin.com/in/aurorawang15/" },
    { name: "Nikhil Mudumbi", tag: "Co-Head of Education", linkedin: "https://www.linkedin.com/in/nikhil-mudumbi-614b17247/" },
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
];

// Corrections to the automatic first-year guess below: person -> the year they
// actually joined CQG. A year before 2023 (e.g. 2020) means no asterisk anywhere.
const FIRST_YEAR_OVERRIDES: Record<string, number> = {
    "Brian Daley": 2022,
    "Akash Kumar": 2022,
};

const namesOf = (people: { name: string }[]) => people.map((p) => p.name);
const firstYears = firstYearByName(
    [
        { year: 2026, names: [...namesOf(execBoard2026), ...namesOf(seniorMembers2627), ...namesOf(underclassmen2627)] },
        { year: 2025, names: [...namesOf(exec2025), ...namesOf(seniorAdvisors), ...namesOf(currentMembers)] },
        { year: 2024, names: [...namesOf(exec2024), ...namesOf(members2425)] },
        { year: 2023, names: [...namesOf(exec2023), ...namesOf(members2324)] },
    ],
    FIRST_YEAR_OVERRIDES
);
const mark = <T extends { name: string }>(people: T[], year: number) => markFirstYear(people, year, firstYears);

export default function MembersPage() {
    return (
        <div className="min-h-screen bg-white">
            <section className="bg-navy relative overflow-hidden py-14 sm:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <span className="tag tag-lime mb-2 block w-fit">Internal Membership &middot; Current Members</span>
                    <div className="chevron chevron-sky mb-4">Current Members</div>
                    <p className="text-[#C3D2EA] text-[1.05rem] lg:whitespace-nowrap">
                        Meet the dedicated students and alumni who make up the Columbia Quant Group.
                    </p>
                    <p className="text-[#9FB1CE] text-sm mt-2.5">
                        Internal members are selected every school year; the executive board is elected to
                        serve each calendar year.
                    </p>
                    <p className="text-[#9FB1CE] text-sm mt-2.5">* First year in CQG</p>
                </div>
            </section>

            <FirmsCollage />
            <ExecBoard firstYearNames={namesOf(execBoard2026).filter((n) => firstYears.get(n) === 2026)} />
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="font-display font-extrabold text-2xl text-navy mb-8">2026–2027 Internal Members</h2>
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
                    <h2 className="font-display font-extrabold text-2xl text-navy mb-8">2025–2026 Internal Members</h2>
                    <div className="space-y-10">
                        <AdvisorList title="Senior Members" advisors={mark(seniorAdvisors, 2025)} />
                        <TeamList title="Underclassmen" members={mark(currentMembers, 2025)} />
                    </div>
                </div>
            </section>
            <section className="bg-paper-alt py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="font-display font-extrabold text-2xl text-navy mb-8">2024 Executive Board</h2>
                    <AdvisorList advisors={mark(exec2024, 2024)} byRole />
                </div>
            </section>
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="font-display font-extrabold text-2xl text-navy mb-8">2024–2025 Internal Members</h2>
                    <TeamList members={mark(members2425, 2024)} />
                </div>
            </section>
            <section className="bg-paper-alt py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="font-display font-extrabold text-2xl text-navy mb-8">2023 Executive Board</h2>
                    <AdvisorList advisors={mark(exec2023, 2023)} byRole />
                </div>
            </section>
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="font-display font-extrabold text-2xl text-navy mb-8">2023–2024 Internal Members</h2>
                    <TeamList members={mark(members2324, 2023)} />
                </div>
            </section>
        </div>
    );
}
