import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-navy-deep text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-wrap gap-10 justify-between border-t border-navy-line">
        <div className="flex flex-col gap-3 max-w-[22rem]">
          <Image
            src="/logo-white.svg"
            alt="Columbia Quant Group"
            width={140}
            height={50}
            className="h-6 w-auto object-contain"
          />
          <p className="text-sm text-[#8CA0C2] leading-relaxed">
            Columbia University&apos;s premier quantitative finance and trading group.
          </p>
        </div>
        <div>
          <h4 className="font-mono text-[0.68rem] tracking-[0.12em] uppercase text-[#7488A8] mb-3.5 font-semibold">
            Connect
          </h4>
          <div className="flex flex-col gap-2.5">
            <a href="mailto:columbia.quant.group@gmail.com" className="text-sm text-[#C9D6EA] hover:text-sky transition-colors">
              columbia.quant.group@gmail.com
            </a>
            <a
              href="https://www.linkedin.com/company/columbia-quant-group/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#C9D6EA] hover:text-sky transition-colors"
            >
              LinkedIn
            </a>
            <a
              href="https://www.instagram.com/columbia.quant.group"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#C9D6EA] hover:text-sky transition-colors"
            >
              Instagram
            </a>
            <Link href="/contact" className="text-sm text-[#C9D6EA] hover:text-sky transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 font-mono text-xs text-[#5D719A]">
        © {new Date().getFullYear()} Columbia Quant Group. All rights reserved.
      </div>
    </footer>
  );
}
