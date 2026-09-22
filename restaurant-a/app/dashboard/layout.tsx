import SideBar from "./components/SideBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-[#0a0f1a] text-slate-200 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[350px] h-[350px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      <aside className="hidden md:block w-64 shrink-0 border-r border-slate-800/80 bg-slate-950/40 backdrop-blur-xl relative z-10">
        <SideBar />
      </aside>

      <main className="flex-1 p-6 sm:p-8 overflow-auto relative z-10">{children}</main>
    </div>
  );
}
