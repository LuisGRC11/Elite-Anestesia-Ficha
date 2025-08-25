import { Link, useLocation } from "react-router-dom";
import { gerarPDF } from "../utils/pdf";
import { ficha } from "../store/fichaStorage";

const BRAND = {
  blue: "#2bb3f8",
  green: "#71d340",
};

export default function TabsNav() {
  const { pathname } = useLocation();

  async function onPDF() {
    try {
      await gerarPDF("./elite-logo.png");
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar PDF. Veja o Console.");
    }
  }

  function onReset() {
    if (!confirm("Confirmar nova ficha? Isso limpa todos os dados.")) return;
    ficha.resetAll();
    localStorage.removeItem("ficha-anestesica:v1:chart");
    window.location.reload();
  }

  const is = (to) =>
    pathname === to
      ? "bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-200"
      : "bg-white/70 text-slate-700 hover:bg-white";

  const Tab = ({ to, icon, label, short }) => (
    <Link
      to={to}
      className={`group flex items-center justify-center gap-2 rounded-full px-3 py-2 text-[11px] sm:text-sm font-semibold ${is(
        to
      )} transition`}
      title={label}
    >
      <span className="text-base sm:text-lg">{icon}</span>
      <span className="truncate">{short ?? label}</span>
    </Link>
  );

  return (
    <header className="sticky top-0 z-50">
      {}
      <div
        className="w-full"
        style={{
          background:
            `linear-gradient(90deg, ${BRAND.green} 0%, ${BRAND.blue} 100%)`,
        }}
      >
        <div className="mx-auto max-w-6xl px-4 py-2 flex items-center gap-3">
          <div className="flex items-center gap-2">

            <div className="text-white/95 font-extrabold tracking-tight">
              Elite <span className="font-black">Anestesia</span>
            </div>
          </div>

          {}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={onPDF}
              className="rounded-xl bg-white/95 px-3 py-1.5 text-emerald-700 text-sm font-semibold shadow-sm hover:bg-white"
              title="Gerar PDF"
            >
              Gerar PDF
            </button>
            <button
              onClick={onReset}
              className="rounded-xl bg-white/90 px-3 py-1.5 text-rose-700 text-sm font-semibold shadow-sm hover:bg-white"
              title="Nova Ficha"
            >
              Nova Ficha
            </button>
          </div>
        </div>
      </div>

      {}
      <div className="bg-white/85 backdrop-blur border-b border-slate-200">
        <nav className="mx-auto max-w-6xl px-3 py-2">
          {}
          <div className="grid grid-cols-4 gap-2">
            <Tab
              to="/"
              icon=""
              label="Dados do Paciente"
              short="Paciente"
            />
            <Tab
              to="/sinais-vitais"
              icon=""
              label="Sinais Vitais"
              short="Sinais"
            />
            <Tab
              to="/medicacoes-e-equipamentos"
              icon=""
              label="Medicações & Equipamentos"
              short="Medicações"
            />
            <Tab
              to="/relatorio-rpa"
              icon=""
              label="Relatório & Cuidados RPA"
              short="RPA"
            />
          </div>
        </nav>
      </div>
    </header>
  );
}
