import ExecBoard from "@/components/team/ExecBoard";
import TeamList from "@/components/team/TeamList";

const currentMembers = [
    { name: "Member 1", linkedin: "https://linkedin.com" },
    { name: "Member 2", linkedin: "https://linkedin.com" },
    { name: "Member 3", linkedin: "https://linkedin.com" },
    { name: "Member 4", linkedin: "https://linkedin.com" },
    { name: "Member 5", linkedin: "https://linkedin.com" },
    { name: "Member 6", linkedin: "https://linkedin.com" },
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
    { name: "Mihir Joshi (CTC)", linkedin: "https://www.linkedin.com/in/mihirjoshi-columbia/" },
    { name: "Nicole Pi (DRW)", linkedin: "https://www.linkedin.com/in/nicoleipi/" },
    { name: "Arjun Parthasarathy (Jump Trading)", linkedin: "https://www.linkedin.com/in/arjun-parthasarathy-276408224/" },
    { name: "Derek Che (Citadel Securities)", linkedin: "https://www.linkedin.com/in/yuyao-c-379a71290/" },
    { name: "Brianna Wang (Datadog)", linkedin: "https://www.linkedin.com/in/brianna-wang-9b674b287/" },
    { name: "Luke Freed (Bridgewater)", linkedin: "https://www.linkedin.com/in/lukefreed/" },
    { name: "Harris Chen (Optiver)", linkedin: "https://www.linkedin.com/in/harrischen-/" },
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
                <TeamList title="Senior Advisors" members={seniorAdvisors} />
                <TeamList title="Current Members (TBA)" members={currentMembers} />
            </div>
        </div>
    );
}
