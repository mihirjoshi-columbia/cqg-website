import AdvisorList from "@/components/team/AdvisorList";
import ExecBoard from "@/components/team/ExecBoard";
import TeamList from "@/components/team/TeamList";
import FirmsCollage from "@/components/placements/FirmsCollage";

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
];

const seniorAdvisors = [
    { name: "Shriya Mahakala", tag: "Jane Street", linkedin: "https://www.linkedin.com/in/shriya-mahakala/" },
    { name: "Kshitig Seth", tag: "Amazon", linkedin: "https://www.linkedin.com/in/kshitig-seth/" },
    { name: "Shobini Iyer", tag: "Google", linkedin: "https://www.linkedin.com/in/shobini-iyer/" },
    { name: "Steven Spasov", tag: "Jane Street", linkedin: "https://www.linkedin.com/in/steven-spasov-24bb43257/" },
    { name: "Luke Freed", tag: "Bridgewater", linkedin: "https://www.linkedin.com/in/lukefreed/" },
    { name: "Harris Chen", tag: "Optiver", linkedin: "https://www.linkedin.com/in/harrischen-/" },
    { name: "Derek Che", tag: "Citadel Securities", linkedin: "https://www.linkedin.com/in/yuyao-c-379a71290/" },
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
                </div>
            </section>

            <FirmsCollage />
            <ExecBoard />
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="font-display font-extrabold text-2xl text-navy mb-8">2026–2027 Internal Members</h2>
                    <div className="space-y-10">
                        <AdvisorList title="Senior Members" advisors={seniorMembers2627} />
                    </div>
                </div>
            </section>
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="font-display font-extrabold text-2xl text-navy mb-8">2025 Executive Board</h2>
                    <AdvisorList advisors={exec2025} keepOrder />
                </div>
            </section>
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="font-display font-extrabold text-2xl text-navy mb-8">2025–2026 Internal Members</h2>
                    <div className="space-y-10">
                        <AdvisorList title="Senior Members" advisors={seniorAdvisors} />
                        <TeamList title="Underclassmen" members={currentMembers} />
                    </div>
                </div>
            </section>
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="font-display font-extrabold text-2xl text-navy mb-8">2024 Executive Board</h2>
                    <AdvisorList advisors={exec2024} keepOrder />
                </div>
            </section>
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="font-display font-extrabold text-2xl text-navy mb-8">2024–2025 Internal Members</h2>
                    <TeamList members={members2425} />
                </div>
            </section>
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="font-display font-extrabold text-2xl text-navy mb-8">2023–2024 Internal Members</h2>
                    <TeamList members={members2324} />
                </div>
            </section>
        </div>
    );
}
