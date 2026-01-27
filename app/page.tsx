import Hero from "@/components/home/Hero";
import About from "@/components/home/About";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <About />
    </div>
  );
}
