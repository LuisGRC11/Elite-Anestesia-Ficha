import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="min-h-[60vh] grid place-items-center px-6">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold">404</h1>
        <p className="mt-2 text-slate-600">Página não encontrada.</p>
        <Link to="/" className="inline-block mt-6 px-4 py-2 rounded-xl bg-sky-600 text-white">
          Voltar
        </Link>
      </div>
    </main>
  );
}
