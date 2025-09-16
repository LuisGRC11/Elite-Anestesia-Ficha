import React from "react";
import ReactDOM from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App";

// pages carregadas sob demanda
const DadosPaciente = React.lazy(() => import("./pages/DadosPaciente.jsx"));
const SinaisVitais = React.lazy(() => import("./pages/SinaisVitais.jsx"));
const MedicacoesEquipamentos = React.lazy(() => import("./pages/MedicacoesEquipamentos.jsx"));
const RelatorioRPA = React.lazy(() => import("./pages/RelatorioRPA.jsx"));
const NotFound = React.lazy(() => import("./pages/NotFound.jsx"));

const suspense = (el) => (
  <React.Suspense fallback={<p className="p-6">Carregando...</p>}>{el}</React.Suspense>
);

const router = createHashRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: suspense(<DadosPaciente />) },
      { path: "sinais-vitais", element: suspense(<SinaisVitais />) },
      { path: "medicacoes-e-equipamentos", element: suspense(<MedicacoesEquipamentos />) },
      { path: "relatorio-rpa", element: suspense(<RelatorioRPA />) },
      { path: "*", element: suspense(<NotFound />) },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* Provider removido por não estar em uso neste momento */}
    <RouterProvider router={router} />
  </React.StrictMode>
);
