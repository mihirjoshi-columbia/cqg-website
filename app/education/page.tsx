import EducationContent from "@/components/education/EducationContent";

export default function EducationPage() {
    return (
        <div className="min-h-screen bg-white pt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-columbia-dark mb-4">
                    Education
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    We provide comprehensive educational resources to help our members master quantitative finance.
                </p>
            </div>

            <EducationContent />
        </div>
    );
}
