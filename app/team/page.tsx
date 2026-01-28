import AdvisorList from "@/components/team/AdvisorList";
import ExecBoard from "@/components/team/ExecBoard";
import TeamList from "@/components/team/TeamList";

const currentMembers = [
    { name: "Steven Spasov", linkedin: "https://www.linkedin.com/in/steven-spasov-24bb43257" },
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

const alumni = [
    { name: "Alumni 1", linkedin: "https://linkedin.com" },
    { name: "Alumni 2", linkedin: "https://linkedin.com" },
    { name: "Alumni 3", linkedin: "https://linkedin.com" },
    { name: "Alumni 4", linkedin: "https://linkedin.com" },
    { name: "Alumni 5", linkedin: "https://linkedin.com" },
    { name: "Alumni 6", linkedin: "https://linkedin.com" },
];

const seniorAdvisors = [
    { name: "Arjun Parthasarathy", company: "Jump Trading", linkedin: "https://www.linkedin.com/in/arjun-parthasarathy-276408224/" },
    { name: "Derek Che", company: "Citadel Securities", linkedin: "https://www.linkedin.com/in/yuyao-c-379a71290/" },
    { name: "Brianna Wang", company: "Datadog", linkedin: "https://www.linkedin.com/in/brianna-wang-9b674b287/" },
    { name: "Luke Freed", company: "Bridgewater", linkedin: "https://www.linkedin.com/in/lukefreed/" },
    { name: "Harris Chen", company: "Optiver", linkedin: "https://www.linkedin.com/in/harrischen-/" },
];

export default function TeamPage() {
    return (
        <div className="min-h-screen bg-white pt-12 pb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-columbia-dark mb-4">
                    Our Team
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Meet the dedicated students and alumni who make up the Columbia Quant Group.
                </p>
            </div>

            <ExecBoard />

            <div className="space-y-16 mt-8">
                <AdvisorList title="Senior Advisors" advisors={seniorAdvisors} />
                <TeamList title="Current Members" members={currentMembers} />
            </div>
        </div>
    );
}
