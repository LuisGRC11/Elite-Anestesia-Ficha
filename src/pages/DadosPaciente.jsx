import { useMemo, useState } from "react";
import { Page, SectionCard, Field, inputBase, selectBase, checkboxBase } from "../components/ui";
import { ficha } from "../store/fichaStorage";

export default function DadosPaciente() {
  const s = ficha.getAll();
  const [pac, setPac] = useState({
    nome: s.paciente.nome || "",
    asa: s.paciente.asa || "",
    idade: s.paciente.idade || "",
    peso: s.paciente.peso || "",
    altura: s.paciente.altura || "",
    urgencia: s.paciente.urgencia || "",
    alergias: s.paciente.alergias || "",
  });

  const [cir, setCir] = useState({
    hospital: s.cirurgia.hospital || "",
    data: s.cirurgia.data || "",
    inicio: s.cirurgia.inicio || "",
    fim: s.cirurgia.fim || "",
    procedimento: s.cirurgia.procedimento || "",
    cirurgiao: s.cirurgia.cirurgiao || "",
    anestesista: s.cirurgia.anestesista || "",
  });
  const [houveInter, setHouveInter] = useState(!!s.intercorrencias.houve);
  const [textoInter, setTextoInter] = useState(s.intercorrencias.texto || "");

  const imc = useMemo(() => {
    const p = parseFloat(String(pac.peso).replace(",", "."));
    const a = parseFloat(String(pac.altura).replace(",", ".")) / 100;
    if (!p || !a) return "";
    const v = p / (a * a);
    return Number.isFinite(v) ? v.toFixed(1) : "";
  }, [pac.peso, pac.altura]);

  const setPacField = (k, v) => {
    setPac((old) => ({ ...old, [k]: v }));
    ficha.setPaciente({ [k]: v });
  };
  const setCirField = (k, v) => {
    setCir((old) => ({ ...old, [k]: v }));
    ficha.setCirurgia({ [k]: v });
  };

  return (
    <Page>
      <SectionCard title="Dados do Paciente" tone="sky">
        <div className="grid gap-4 sm:gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome Completo">
              <input
                className={inputBase}
                placeholder="Nome e sobrenome"
                value={pac.nome}
                onChange={(e) => setPacField("nome", e.target.value)}
              />
            </Field>
            <Field label="Classificação ASA">
              <select
                className={selectBase}
                value={pac.asa}
                onChange={(e) => setPacField("asa", e.target.value)}
              >
                <option value="">Selecione</option>
                {["I", "II", "III", "IV", "V", "VI"].map((n) => (
                  <option key={n}>{`ASA ${n}`}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Idade">
              <input
                type="number"
                className={inputBase}
                placeholder="Anos"
                value={pac.idade}
                onChange={(e) => setPacField("idade", e.target.value)}
              />
            </Field>
            <Field label="Peso (kg)">
              <input
                type="number"
                className={inputBase}
                placeholder="kg"
                value={pac.peso}
                onChange={(e) => setPacField("peso", e.target.value)}
              />
            </Field>
            <Field label="Altura (cm)">
              <input
                type="number"
                className={inputBase}
                placeholder="cm"
                value={pac.altura}
                onChange={(e) => setPacField("altura", e.target.value)}
              />
            </Field>
            <Field label="IMC">
              <input
                readOnly
                value={imc}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 shadow-inner"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="E (Urgência)">
              <select
                className={selectBase}
                value={pac.urgencia}
                onChange={(e) => setPacField("urgencia", e.target.value)}
              >
                <option value="">Selecione</option>
                <option>E0 — Eletivo</option>
                <option>E1 — Urgência</option>
                <option>E2 — Emergência</option>
              </select>
            </Field>
            <Field label="Alergias">
              <input
                className={inputBase}
                placeholder="Descreva as alergias conhecidas"
                value={pac.alergias}
                onChange={(e) => setPacField("alergias", e.target.value)}
              />
            </Field>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Dados da Cirurgia" tone="emerald">
        <div className="grid gap-4 sm:gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Clínica/Hospital">
              <input
                className={inputBase}
                placeholder="Nome da clínica ou hospital"
                value={cir.hospital}
                onChange={(e) => setCirField("hospital", e.target.value)}
              />
            </Field>
            <Field label="Data da Cirurgia">
              <input
                className={inputBase}
                placeholder="dd/mm/aaaa"
                inputMode="numeric"
                value={cir.data}
                onChange={(e) => setCirField("data", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Hora de Início">
              <input
                type="time"
                className={inputBase}
                value={cir.inicio}
                onChange={(e) => setCirField("inicio", e.target.value)}
              />
            </Field>
            <Field label="Hora de Fim">
              <input
                type="time"
                className={inputBase}
                value={cir.fim}
                onChange={(e) => setCirField("fim", e.target.value)}
              />
            </Field>
            <Field label="Procedimento">
              <input
                className={inputBase}
                placeholder="Descrição do procedimento"
                value={cir.procedimento}
                onChange={(e) => setCirField("procedimento", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cirurgião">
              <input
                className={inputBase}
                placeholder="Nome do cirurgião"
                value={cir.cirurgiao}
                onChange={(e) => setCirField("cirurgiao", e.target.value)}
              />
            </Field>
            <Field label="Anestesiologista">
              <input
                className={inputBase}
                placeholder="Nome do anestesiologista"
                value={cir.anestesista}
                onChange={(e) => setCirField("anestesista", e.target.value)}
              />
            </Field>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Intercorrências & Técnicas Anestésicas" tone="sky">
        <div className="grid gap-6">
          {}
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className={checkboxBase}
              checked={houveInter}
              onChange={(e) => {
                const marcado = e.target.checked;
                setHouveInter(marcado);
                ficha.setIntercorrencias({
                  houve: marcado,
                  texto: marcado ? textoInter : "",
                });
              }}
            />
            <span className="text-slate-700">Houve intercorrências</span>
          </label>

          {}
          <div
            className={`transition-all duration-300 ${
              houveInter
                ? "opacity-100 translate-y-0 max-h-[320px]"
                : "opacity-0 -translate-y-1 max-h-0 overflow-hidden pointer-events-none"
            }`}
            aria-hidden={!houveInter}
          >
            <textarea
              rows={4}
              className={`${inputBase} h-auto`}
              placeholder="Descreva aqui, se houver."
              value={textoInter}
              onChange={(e) => {
                const v = e.target.value;
                setTextoInter(v);
                ficha.setIntercorrencias({ texto: v });
              }}
            />
          </div>

          {}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Geral Balanceada",
              "Geral Venosa",
              "Geral Inalatória",
              "Sedação Consciente",
              "Sedação Profunda",
              "Raquianestesia",
              "Peridural",
              "Peridural Contínua",
              "Bloqueio Regional",
              "Bloqueio de Plexo",
              "Bloqueio Periférico",
              "Anestesia Combinada (Geral + Regional)",
              "Anestesia Combinada (Raqui + Peridural)",
              "Anestesia Local",
              "Anestesia Tópica",
            ].map((t) => (
              <label
                key={t}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md hover:border-sky-200"
              >
                <input
                  type="checkbox"
                  className={checkboxBase}
                  defaultChecked={(s.tecnicas || []).includes(t)}
                  onChange={() => ficha.toggleTecnica(t)}
                />
                <span className="text-slate-700">{t}</span>
              </label>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Monitorização" tone="lavender">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "ECG",
            "Pressão Arterial",
            "Oximetria de Pulso",
            "Capnografia",
            "Temperatura",
            "BIS",
            "TOF",
            "Pressão Venosa Central",
          ].map((m) => (
            <label key={m} className="flex items-center gap-3">
              <input
                type="checkbox"
                className={checkboxBase}
                defaultChecked={!!s.monitorizacao[m]}
                onChange={(e) => ficha.setMonitor(m, e.target.checked)}
              />
              <span className="text-slate-700">{m}</span>
            </label>
          ))}
        </div>
      </SectionCard>
    </Page>
  );
}
