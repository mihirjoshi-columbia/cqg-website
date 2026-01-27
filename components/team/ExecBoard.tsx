"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Linkedin } from "lucide-react";

const execBoard = [
    {
        name: "Aurora Wang",
        role: "President",
        image: "/team/aurora.jpeg",
        linkedin: "https://www.linkedin.com/in/aurorawang15/",
        bio: "Aurora is a CS major in the School of Engineering and Applied Sciences. She is interested in quantitative modeling for market execution and fixed income investment, with additional interests in economic policy and NLP. Outside of CQG, Aurora plays piano extensively, in part through Columbia’s Music Performance Program. She will be interning at IMC this summer as a Quantitative Trading intern, and she previously interned at Weiss Asset Management on the Risk, Treasury, and Trading teams. In her free time, Aurora enjoys cafe hopping, playing the NYT Mini, and watching films."
    },
    {
        name: "Nicole Pi",
        role: "External VP",
        image: "/team/nicole.jpg",
        linkedin: "https://www.linkedin.com/in/nicoleipi/",
        bio: "Nicole is a CS major in the School of Engineering and Applied Sciences. She is interested in statistical modeling and machine learning for financial markets, responsible AI, and building systems that are safe, reliable, and scalable. Nicole also serves as a committee leader for Columbia Organization for Rising Entrepreneurs (CORE), facilitates reading groups for Columbia AI Alignment (CAIAC), and is a TA for Introduction to Databases. She will be interning at DRW this summer as a quantitative trading intern, and she has previously interned at SpaceX and Goldman Sachs as a software engineer intern. In her free time, Nicole enjoys running, playing poker, and indulging her sweet tooth."
    },
    {
        name: "Srirag Tatavarti",
        role: "Head of Outreach",
        image: "/team/srirag.jpeg",
        linkedin: "https://www.linkedin.com/in/srirag-tatavarti/",
        bio: "CS, Applied Math @ Columbia University. Incoming SWE intern @ Databricks. Interested in Quantitative Finance, ML, and Synthetic Biology."
    },
    {
        name: "Mihir Joshi",
        role: "Co-Head of Education", // Inherited role from Aurora's slot
        image: "/team/mihir.jpeg",
        linkedin: "https://www.linkedin.com/in/mihirjoshi-columbia/",
        bio: "Mihir is a CS major in the School of Engineering and Applied Sciences. He is interested in low-latency, high-performance systems and computer architecture, but also has a passion for portfolio management and fundamental investing. He serves as the CFO of Lion Fund, LLC (the oldest student-run hedge fund at Columbia) and also TAs for Operating Systems and Fundamentals of Computer Systems. He will be interning at Chicago Trading Company next summer as a Quantitative Trading intern. In his free time, Mihir enjoys dancing with Columbia Bhangra, playing poker, and eating ramen at various restaurants in NYC."
    },
    {
        name: "Nikhil Mudumbi",
        role: "Co-Head of Education",
        image: "/team/nikhil.jpeg",
        linkedin: "https://www.linkedin.com/in/nikhil-mudumbi-614b17247/",
        bio: "Nikhil is a Math major at Columbia College. He’s extremely interested in analysis and probability, from stochastics/financial modeling to integrable and combinatorial probability. Outside of CQG, he is one of the presidents of the Hindu Students Organization on campus and is a TA for Machine Learning. He’s interned at Jane Street as a trading intern and will spend the upcoming summer conducting math research at Columbia. In this free time, Nikhil enjoys running, drinking coffee, and watching football."
    },
    {
        name: "Alison Wu",
        role: "Head of Marketing",
        image: "/team/alison.jpeg",
        linkedin: "https://www.linkedin.com/in/alison-wu-8387961b5/",
        bio: "FE + CS @ Columbia. Incoming Quant Summer Analyst @ Goldman Sachs. Former INSIGHT Program Participant at Jane Street."
    },
];

export default function ExecBoard() {
    return (
        <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold text-columbia-dark mb-12 text-center">Executive Board</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {execBoard.map((exec, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 flex flex-col"
                        >
                            <Link href={exec.linkedin} target="_blank" rel="noopener noreferrer" className="block relative">
                                <div className="aspect-square relative bg-gray-200 overflow-hidden">
                                    {exec.image ? (
                                        <Image
                                            src={exec.image}
                                            alt={exec.name}
                                            fill
                                            unoptimized
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            {/* Placeholder or just empty grey background */}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-columbia-dark/0 group-hover:bg-columbia-dark/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <Linkedin className="text-white w-8 h-8" />
                                    </div>
                                </div>
                            </Link>
                            <div className="p-6 flex flex-col flex-grow">
                                <h3 className="font-bold text-xl text-columbia-dark mb-1">{exec.name}</h3>
                                <p className="text-columbia-secondary font-medium mb-3">{exec.role}</p>
                                <p className="text-gray-600 text-sm line-clamp-3 flex-grow">
                                    {exec.bio}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
