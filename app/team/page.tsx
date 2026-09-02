import AdvisorList from "@/components/team/AdvisorList";
import ExecBoard from "@/components/team/ExecBoard";
import TeamList from "@/components/team/TeamList";

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
    { name: "Shriya Mahakala", company: "Jane Street", linkedin: "https://www.linkedin.com/in/shriya-mahakala/" },
    { name: "Kshitig Seth", company: "Amazon", linkedin: "https://www.linkedin.com/in/kshitig-seth/" },
    { name: "Shobini Iyer", company: "Google", linkedin: "https://www.linkedin.com/in/shobini-iyer/" },
    { name: "Steven Spasov", company: "", linkedin: "https://www.linkedin.com/in/steven-spasov-24bb43257/" },
    { name: "Luke Freed", company: "Bridgewater", linkedin: "https://www.linkedin.com/in/lukefreed/" },
    { name: "Harris Chen", company: "Optiver", linkedin: "https://www.linkedin.com/in/harrischen-/" },
];

export default function TeamPage() {
    return (
        <div className="min-h-screen bg-white">
            <section className="bg-navy relative overflow-hidden py-14 sm:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="chevron chevron-sky mb-4">Our Team</div>
                    <p className="text-[#C3D2EA] text-[1.05rem] max-w-xl">
                        Meet the dedicated students and alumni who make up the Columbia Quant Group.
                    </p>
                    <p className="text-[#9FB1CE] text-sm mt-2.5">
                        Internal members are selected every school year; the executive board is elected to
                        serve each calendar year.
                    </p>
                </div>
            </section>

            <ExecBoard />
            <AdvisorList title="2025–2026 Senior Members" advisors={seniorAdvisors} />
            <TeamList title="2025–2026 Internal Members" members={currentMembers} />
        </div>
    );
}
