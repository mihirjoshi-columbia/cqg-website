import ScrollingLogos from "@/components/placements/ScrollingLogos";
import FirmsCollage from "@/components/placements/FirmsCollage";

export default function PlacementsPage() {
    return (
        <div className="min-h-screen bg-white pt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-columbia-dark mb-4">
                    Placements
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Our members consistently secure top roles at leading quantitative finance firms,
                    tech companies, and investment banks.
                </p>
            </div>

            <ScrollingLogos />
            <FirmsCollage />
        </div>
    );
}
