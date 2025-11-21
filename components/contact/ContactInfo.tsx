"use client";

import { Mail } from "lucide-react";

export default function ContactInfo() {
    return (
        <section className="py-16">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                            <Mail className="w-8 h-8 text-columbia-secondary" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-columbia-dark mb-8">Get in Touch</h2>

                    <div className="space-y-6">
                        <div>
                            <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">General Inquiries</p>
                            <a href="mailto:cqg@columbia.edu" className="text-xl text-columbia-dark hover:text-columbia-secondary transition-colors font-medium">
                                cqg@columbia.edu
                            </a>
                        </div>

                        <div className="w-16 h-px bg-gray-100 mx-auto"></div>

                        <div>
                            <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">President</p>
                            <a href="mailto:president@columbia.edu" className="text-xl text-columbia-dark hover:text-columbia-secondary transition-colors font-medium">
                                columbia.quant.group [at] columbia [dot] edu
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
