import Navbar from "@/components/landing/Navbar";

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  // Citizen layout is mostly full-screen public facing, shared navbar with Landing Page
  return (
    <div className="min-h-screen bg-[#020617] text-white relative font-sans flex flex-col">
      <Navbar />
      <main className="flex-1 w-full flex flex-col">
        {children}
      </main>
    </div>
  );
}
