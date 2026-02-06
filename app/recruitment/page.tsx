export default function RecruitmentPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
            <h1 className="text-4xl font-bold text-columbia-dark mb-8">Recruitment</h1>
            <div className="max-w-3xl space-y-6 text-xl text-gray-600">
                <p>
                    We recruit members on a yearly basis in the fall semester. Catch us at the fall club fair or keep an eye out for our membership application, which will be sent out in the fall.
                </p>
                <p>
                    However, feel free to sign up for our general body at{" "}
                    <a
                        href="https://docs.google.com/forms/d/e/1FAIpQLSf40xbUhMYx8ELABAJccR5BftONiy-W5QZohLuGVV2pQAxf5A/viewform?usp=dialog"
                        className="text-columbia-dark underline hover:opacity-80 transition-opacity"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        this link
                    </a>
                    . All general body members will receive emails about our events, including information sessions, trading/market-making games, and Q&As with firms and startups.
                </p>
            </div>
        </div>
    );
}
