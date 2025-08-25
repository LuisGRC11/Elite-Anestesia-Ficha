import TabsNav from "./components/TabsNav";
import { Outlet } from "react-router-dom";

export default function App() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50">
      {/* Navbar fixa/visível com ações */}
      <TabsNav />

      {/* Conteúdo centralizado e com padding; evita scroll horizontal */}
      <div className="mx-auto max-w-6xl px-4 pb-12">
        <Outlet />
      </div>
    </main>
  );
}
