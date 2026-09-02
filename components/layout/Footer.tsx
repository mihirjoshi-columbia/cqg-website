import Image from "next/image";
import { LinkedInIcon, InstagramIcon, MailIcon } from "@/components/icons/SocialIcons";

export default function Footer() {
    return (
        <footer className="bg-navy-deep text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 flex flex-col sm:flex-row gap-10 sm:gap-20 border-t border-navy-line text-left">
                <div className="flex flex-col items-start gap-3.5 max-w-sm">
                    <Image
                        src="/logo-white.svg"
                        alt="Columbia Quant Group"
                        width={140}
                        height={50}
                        className="h-7 w-auto object-contain"
                    />
                    <p className="text-sm text-[#8CA0C2] leading-relaxed">
                        Columbia University&apos;s only student organization dedicated to quantitative
                        finance and trading &mdash; serving undergraduate and graduate students alike.
                    </p>
                </div>

                <div>
                    <h4 className="font-mono text-[0.68rem] tracking-[0.12em] uppercase text-[#7488A8] mb-3.5 font-semibold">
                        Connect
                    </h4>
                    <div className="flex items-center gap-4">
                        <a
                            href="mailto:columbia.quant.group@gmail.com"
                            aria-label="Email CQG"
                            className="text-[#C9D6EA] hover:text-sky transition-colors"
                        >
                            <MailIcon />
                        </a>
                        <a
                            href="https://www.linkedin.com/company/columbia-quant-group/"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="CQG on LinkedIn"
                            className="text-[#C9D6EA] hover:text-sky transition-colors"
                        >
                            <LinkedInIcon />
                        </a>
                        <a
                            href="https://www.instagram.com/columbia.quant.group"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="CQG on Instagram"
                            className="text-[#C9D6EA] hover:text-sky transition-colors"
                        >
                            <InstagramIcon />
                        </a>
                    </div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 pt-2 font-mono text-xs text-[#5D719A] border-t border-navy-line/60">
                <div className="pt-4">© {new Date().getFullYear()} Columbia Quant Group. All rights reserved.</div>
            </div>
        </footer>
    );
}
