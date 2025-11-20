import Image from "next/image";
import Hero from "@/components/home/Hero";
import About from "@/components/home/About";
import Sponsors from "@/components/home/Sponsors";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <About />
      <Sponsors />
    </div>
  );
}
