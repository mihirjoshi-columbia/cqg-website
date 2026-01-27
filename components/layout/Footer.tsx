import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-columbia-dark text-white py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                        <span className="text-xl font-bold">Columbia Quant Group</span>
                        <p className="text-sm text-gray-300 mt-1">
                            © {new Date().getFullYear()} Columbia Quant Group. All rights reserved.
                        </p>
                    </div>
                    <div className="flex space-x-6">
                        <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                            Contact
                        </Link>
                        <Link href="https://www.linkedin.com/company/columbia-quant-group/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                            LinkedIn
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
