// src/pages/MedicacoesEquipamentos.jsx
import { useState, useMemo } from "react";
import { Page, SectionCard, Field, inputBase, selectBase, checkboxBase } from "../components/ui";
import { ficha } from "../store/fichaStorage";

const MEDICACOES = [
  "Propofol","Midazolam","Fentanil","Morfina","Atracúrio","Rocurônio",
  "Sevoflurano","Isoflurano","Lidocaína","Bupivacaína","Epinefrina",
  "Atropina","Neostigmina","Sugamadex","Cetamina","Dexmedetomidina"
];
const UNIDADES_ADMIN = ["mg","mcg","ml","UI"];
const VIAS_ADMIN = ["EV","IM","VO","SL","Inalatória"];

const UNIDADES_OUTRAS = ["mg","mcg","ml","UI","g","%"];
const VIAS_OUTRAS = ["EV","IM","VO","SL","Inalatória","Tópica","SC"];

const TIPOS_FLUIDO = ["Soroterapia","Plasma","Sangue/Derivados"];
const OP_FLUIDOS = {
  Soroterapia:["SF 0,9%","SG 5%","Ringer Lactato","Ringer Simples","SG 10%","Manitol 20%"],
  Plasma:["Plasma Fresco"],
  "Sangue/Derivados":["Concentrado de Hemácias","Plaquetas","Crioprecipitado"]
};
const VOLUMES = ["250ml","500ml","1000ml"];

/* ===== Helpers de formatação ===== */
function toTitleCase(s) {
  return (s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/(^|\s|[({[\"'-])([a-zà-ú])/g, (_, a, b) => a + b.toUpperCase());
}

/**
 * Máscara BR que:
 * - aceita ponto ou vírgula (normaliza para vírgula),
 * - mantém a vírgula visível mesmo sem casas decimais (ex.: "0," ou "12,"),
 * - limita inteiros/decimais (maxInt/maxDec),
 * - quando maxDec = 0, retorna apenas inteiros.
 */
function maskDecimalBR(raw, maxInt = 4, maxDec = 2) {
  if (raw == null) return "";
  let x = String(raw);

  // manter só dígitos e separadores (.,)
  x = x.replace(/[^\d,\.]/g, "");
  // normalizar para vírgula
  x = x.replace(/\./g, ",");

  // separar primeira parte e o resto (remove vírgulas extras)
  const parts = x.split(",");
  let int = (parts[0] || "").replace(/^0+(?=\d)/, ""); // tira zeros à esquerda
  int = int.slice(0, maxInt);

  if (maxDec === 0) {
    // campo somente inteiro
    return int;
  }

  let decRaw = parts.slice(1).join(""); // junta o que sobrou (sem vírgulas)
  decRaw = decRaw.replace(/,/g, "");
  if (decRaw.length > maxDec) decRaw = decRaw.slice(0, maxDec);

  // vírgula digitada mas sem decimais ainda -> manter "0," ou "int,"
  if (x.endsWith(",") && decRaw.length === 0) {
    return (int || "0") + ",";
  }

  // com decimais
  return decRaw ? `${int || "0"},${decRaw}` : int;
}

// clamp simples com formatação BR (vírgula)
function clampRangeBR(v, min, max, dec = 0) {
  if (v == null || v === "") return "";
  let n = parseFloat(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return "";
  n = Math.min(max, Math.max(min, n));
  const f = Number.isFinite(dec) && dec > 0 ? n.toFixed(dec) : String(Math.round(n));
  return f.replace(".", ",");
}
// CAM: 0,0–6,0 (clamp)
function clampCamBR(v) { return clampRangeBR(v, 0, 6, 1); }

/* Ventilação */
const VENT_MODOS = [
  "VCV (Volume Control)",
  "PCV (Pressure Control)",
  "SIMV",
  "PSV",
  "BIPAP",
];

const TOF_PADROES = ["TOF", "Tetânico", "PTC"];
const TOF_MUSCULOS = ["Adutor do polegar", "Orbicular dos olhos", "Tibial anterior"];

const TCI_OPCOES = ["TCI - Schneider", "TCI - Marsh", "TIVA volumétrica (mL/h)"];
const TCI_ALVOS = ["Plasma", "Efeito"];

export default function MedicacoesEquipamentos() {
  const s = ficha.getAll();

  const [adm, setAdm] = useState({ nome: "", dose: "", unidade: "mg", via: "EV", horario: "" });
  const [admList, setAdmList] = useState(s.meds.administradas || []);

  const [out, setOut] = useState({ nome: "", dose: "", unidade: "mg", via: "EV", horario: "" });
  const [outList, setOutList] = useState(s.meds.outras || []);

  const [flu, setFlu] = useState({ tipo: "Soroterapia", fluido: "", volume: "250ml", horario: "" });
  const [fluList, setFluList] = useState(s.meds.fluidos || []);
  const fluidosDoTipo = useMemo(() => OP_FLUIDOS[flu.tipo] ?? [], [flu.tipo]);

  const [equip, setEquip] = useState({
    modelo: s.meds.equipamentos?.modelo || "",
    outros: s.meds.equipamentos?.outros || "",
    ventilacao: s.meds.equipamentos?.ventilacao || "Espontânea",

    oxi_lpm: s.meds.equipamentos?.oxi_lpm || "",

    vent_modo: s.meds.equipamentos?.vent_modo || "",
    vent_fio2: s.meds.equipamentos?.vent_fio2 || "",
    vent_peep: s.meds.equipamentos?.vent_peep || "",
    vent_ie: s.meds.equipamentos?.vent_ie || "",
    vent_rr: s.meds.equipamentos?.vent_rr || "",
    vent_vt_ml: s.meds.equipamentos?.vent_vt_ml || "",
    vent_pinsp: s.meds.equipamentos?.vent_pinsp || "",

    tci_modo: s.meds.equipamentos?.tci_modo || "",       
    tci_alvo: s.meds.equipamentos?.tci_alvo || "",       
    tci_taxa_ml_h: s.meds.equipamentos?.tci_taxa_ml_h || "",
    // novos TCI
    tci_conc_val: s.meds.equipamentos?.tci_conc_val || "",
    tci_conc_unit: s.meds.equipamentos?.tci_conc_unit || "ng",

    bis_info: s.meds.equipamentos?.bis_info || "",
    // TOF
    tof_padrao: s.meds.equipamentos?.tof_padrao || "",
    tof_musculo: s.meds.equipamentos?.tof_musculo || "",
    tof_ratio: s.meds.equipamentos?.tof_ratio || "",
    // novos TOF
    tof_ptc: s.meds.equipamentos?.tof_ptc || "",
    tof_tetanica: !!s.meds.equipamentos?.tof_tetanica,

    // Gases
    arcomp_litros: s.meds.equipamentos?.arcomp_litros || "",
    n2o_litros: s.meds.equipamentos?.n2o_litros || "",

    // Halogenados (CAM)
    cam_sevo: s.meds.equipamentos?.cam_sevo || "",
    cam_halotano: s.meds.equipamentos?.cam_halotano || "",
    cam_isoflurano: s.meds.equipamentos?.cam_isoflurano || "",
    cam_enflurano: s.meds.equipamentos?.cam_enflurano || "",
  });

  const [marks, setMarks] = useState({
    tci: !!s.meds.equipamentos?.tci,
    bis: !!s.meds.equipamentos?.bis,
    tof: !!s.meds.equipamentos?.tof,
    multiparam: !!s.meds.equipamentos?.multiparam,
    oxigenio: !!s.meds.equipamentos?.oxigenio,
    arcomp: !!s.meds.equipamentos?.arcomp,
    n2o: !!s.meds.equipamentos?.n2o,
  });

  const isMecanica = equip.ventilacao !== "Espontânea";
  const modo = equip.vent_modo;

  const addAdm = () => {
    if (!adm.nome) return;
    const next = [...admList, { ...adm, dose: maskDecimalBR(adm.dose, 4, 2) }];
    setAdmList(next);
    ficha.addMedAdministrada(next[next.length - 1]);
    setAdm({ nome: "", dose: "", unidade: "mg", via: "EV", horario: "" });
  };
  const delAdm = (i) => {
    setAdmList((a) => a.filter((_, idx) => idx !== i));
    ficha.removeMedAdministrada(i);
  };

  const addOut = () => {
    const nomeFinal = out.nome.trim();
    if (!nomeFinal) return;
    const payload = {
      ...out,
      nome: toTitleCase(nomeFinal),
      dose: maskDecimalBR(out.dose, 4, 2),
    };
    const next = [...outList, payload];
    setOutList(next);
    ficha.addOutraMed(payload);
    setOut({ nome: "", dose: "", unidade: "mg", via: "EV", horario: "" });
  };
  const delOut = (i) => {
    setOutList((a) => a.filter((_, idx) => idx !== i));
    ficha.removeOutraMed(i);
  };

  const addFlu = () => {
    if (!flu.fluido) return;
    const next = [...fluList, { ...flu }];
    setFluList(next);
    ficha.addFluido(next[next.length - 1]);
    setFlu({ tipo: "Soroterapia", fluido: "", volume: "250ml", horario: "" });
  };
  const delFlu = (i) => {
    setFluList((a) => a.filter((_, idx) => idx !== i));
    ficha.removeFluido(i);
  };

  const onEnterAdd = (e, fn) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fn();
    }
  };

  const setEquipField = (k, v) => {
    setEquip((prev) => ({ ...prev, [k]: v }));
    ficha.setEquip({ [k]: v });
  };

  // helpers TCI
  const onChangeTciConcVal = (raw) => {
    const masked = maskDecimalBR(raw, 4, 2); // permite 2 casas
    setEquipField("tci_conc_val", masked);
  };
  const onBlurTciConcVal = () => {
    const unit = equip.tci_conc_unit || "ng";
    // faixas por unidade
    const ranges = { ng:[0,10,2], mcg:[0,100,1], mg:[0.01,1000,2] }; // [min,max,dec]
    const [min,max,dec] = ranges[unit];
    setEquipField("tci_conc_val", clampRangeBR(equip.tci_conc_val, min, max, dec));
  };
  const onBlurTciTaxa = () => {
    setEquipField("tci_taxa_ml_h", clampRangeBR(equip.tci_taxa_ml_h, 0, 300, 0));
  };

  return (
    <Page>
      {/* ================= Medicações Administradas ================= */}
      <SectionCard title="Medicações Administradas" tone="emerald">
        <div className="grid gap-4 sm:grid-cols-5">
          <Field label="Medicação">
            <select
              className={selectBase}
              value={adm.nome}
              onChange={(e) => setAdm({ ...adm, nome: e.target.value })}
            >
              <option value="">Selecione...</option>
              {MEDICACOES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>

          <Field label="Dose">
            <input
              className={inputBase}
              inputMode="decimal"
              placeholder="Ex.: 2,5"
              value={adm.dose}
              onChange={(e) => setAdm({ ...adm, dose: maskDecimalBR(e.target.value, 4, 2) })}
            />
          </Field>

          <Field label="Unidade">
            <select
              className={selectBase}
              value={adm.unidade}
              onChange={(e) => setAdm({ ...adm, unidade: e.target.value })}
            >
              {UNIDADES_ADMIN.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </Field>

          <Field label="Via">
            <select
              className={selectBase}
              value={adm.via}
              onChange={(e) => setAdm({ ...adm, via: e.target.value })}
            >
              {VIAS_ADMIN.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>

          <Field label="Horário">
            <input
              type="time"
              className={inputBase}
              value={adm.horario}
              onChange={(e) => setAdm({ ...adm, horario: e.target.value })}
              onKeyDown={(e) => onEnterAdd(e, addAdm)}
            />
          </Field>
        </div>

        <div className="mt-4">
          <button
            onClick={addAdm}
            className="rounded-xl bg-emerald-600 px-5 py-2 font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-[.98] transition"
          >
            ＋ Adicionar Medicação
          </button>
        </div>

        <ListTable
          headers={["Medicação", "Dose", "Unid.", "Via", "Hora", ""]}
          rows={admList.map((m) => [m.nome, m.dose, m.unidade, m.via, m.horario])}
          onDelete={delAdm}
        />
      </SectionCard>

      {/* ================= Outras Medicações ================= */}
      <SectionCard title="Outras Medicações" tone="lavender">
        <div className="grid gap-4 sm:grid-cols-5">
          <Field label="Nome da Medicação">
            <input
              className={inputBase}
              list="med-sug"
              value={out.nome}
              placeholder="Digite o nome"
              onChange={(e) => setOut({ ...out, nome: e.target.value })}
              onBlur={(e) => setOut((o) => ({ ...o, nome: toTitleCase(e.target.value) }))}
            />
            <datalist id="med-sug">
              {MEDICACOES.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </Field>

          <Field label="Dose">
            <input
              className={inputBase}
              inputMode="decimal"
              placeholder="Ex.: 5,0"
              value={out.dose}
              onChange={(e) => setOut({ ...out, dose: maskDecimalBR(e.target.value, 4, 2) })}
            />
          </Field>

          <Field label="Unidade">
            <select
              className={selectBase}
              value={out.unidade}
              onChange={(e) => setOut({ ...out, unidade: e.target.value })}
            >
              {UNIDADES_OUTRAS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </Field>

          <Field label="Via">
            <select
              className={selectBase}
              value={out.via}
              onChange={(e) => setOut({ ...out, via: e.target.value })}
            >
              {VIAS_OUTRAS.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>

          <Field label="Horário">
            <input
              type="time"
              className={inputBase}
              value={out.horario}
              onChange={(e) => setOut({ ...out, horario: e.target.value })}
              onKeyDown={(e) => onEnterAdd(e, addOut)}
            />
          </Field>
        </div>

        <div className="mt-4">
          <button
            onClick={addOut}
            className="rounded-xl bg-sky-600 px-5 py-2 font-semibold text-white shadow-sm hover:bg-sky-700 active:scale-[.98] transition"
          >
            ＋ Adicionar Outra Medicação
          </button>
        </div>

        <ListTable
          headers={["Medicação", "Dose", "Unid.", "Via", "Hora", ""]}
          rows={outList.map((m) => [m.nome, m.dose, m.unidade, m.via, m.horario])}
          onDelete={delOut}
          color="sky"
        />
      </SectionCard>

      {/* ================= Terapia de Fluidos ================= */}
      <SectionCard title="Terapia de Fluidos" tone="sky">
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Tipo">
            <select
              className={selectBase}
              value={flu.tipo}
              onChange={(e) => setFlu({ ...flu, tipo: e.target.value, fluido: "" })}
            >
              {TIPOS_FLUIDO.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>

          <Field label="Fluido">
            <select
              className={selectBase}
              value={flu.fluido}
              onChange={(e) => setFlu({ ...flu, fluido: e.target.value })}
            >
              <option value="">Selecione...</option>
              {fluidosDoTipo.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </Field>

          <Field label="Volume">
            <select
              className={selectBase}
              value={flu.volume}
              onChange={(e) => setFlu({ ...flu, volume: e.target.value })}
            >
              {VOLUMES.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>

          <Field label="Horário">
            <input
              type="time"
              className={inputBase}
              value={flu.horario}
              onChange={(e) => setFlu({ ...flu, horario: e.target.value })}
              onKeyDown={(e) => onEnterAdd(e, addFlu)}
            />
          </Field>
        </div>

        <div className="mt-4">
          <button
            onClick={addFlu}
            className="rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[.98] transition"
          >
            ＋ Adicionar Fluido
          </button>
        </div>

        <ListTable
          headers={["Tipo", "Fluido", "Volume", "Hora", ""]}
          rows={fluList.map((f) => [f.tipo, f.fluido, f.volume, f.horario])}
          onDelete={delFlu}
          color="indigo"
        />
      </SectionCard>

      {/* ================= Equipamentos ================= */}
      <SectionCard title="Equipamentos" tone="lavender">
        <div className="grid gap-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-3">
              {[
                ["tci", "Bomba TCI / TIVA"],
                ["bis", "Monitor BIS"],
                ["tof", "Monitor TOF"],
                ["multiparam", "Monitor Multiparamétrico (SPO₂, PNI, ECG)"],
                ["oxigenio", "OXIGÊNIO"],
                ["arcomp", "Ar Comprimido"],
                ["n2o", "Óxido Nitroso (N₂O)"],
              ].map(([k, label]) => (
                <label key={k} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className={checkboxBase}
                    checked={!!marks[k]}
                    onChange={() => {
                      const val = !marks[k];
                      setMarks((st) => ({ ...st, [k]: val }));
                      ficha.setEquip({ [k]: val });
                    }}
                  />
                  <span className="text-slate-700">{label}</span>
                </label>
              ))}
            </div>

            <div className="grid gap-4">
              <Field label="Aparelho de Anestesia">
                <input
                  className={inputBase}
                  placeholder="Modelo/marca do aparelho"
                  value={equip.modelo}
                  onChange={(e) => setEquipField("modelo", e.target.value)}
                  onBlur={(e) => setEquipField("modelo", toTitleCase(e.target.value))}
                />
              </Field>

              <Field label="Outros Equipamentos">
                <input
                  className={inputBase}
                  placeholder="Descreva outros equipamentos utilizados"
                  value={equip.outros}
                  onChange={(e) => setEquipField("outros", e.target.value)}
                  onBlur={(e) => setEquipField("outros", toTitleCase(e.target.value))}
                />
              </Field>

              <Field label="Modo de Ventilação">
                <select
                  className={selectBase}
                  value={equip.ventilacao}
                  onChange={(e) => setEquipField("ventilacao", e.target.value)}
                >
                  <option>Espontânea</option>
                  <option>Assistida</option>
                  <option>Controlada</option>
                </select>
              </Field>
            </div>
          </div>

          {/* OXIGÊNIO */}
          {marks.oxigenio && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Fluxo O₂ (L/min)">
                  <input
                    className={inputBase}
                    inputMode="decimal"
                    placeholder="Ex.: 3"
                    value={equip.oxi_lpm}
                    onChange={(e) => setEquipField("oxi_lpm", maskDecimalBR(e.target.value, 3, 1))}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* AR COMPRIMIDO (L) */}
          {marks.arcomp && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Ar Comprimido — Quantidade (L)">
                  <input
                    className={inputBase}
                    inputMode="decimal"
                    placeholder="Ex.: 500"
                    value={equip.arcomp_litros}
                    onChange={(e) =>
                      setEquipField("arcomp_litros", maskDecimalBR(e.target.value, 4, 0))
                    }
                  />
                </Field>
              </div>
            </div>
          )}

          {/* ÓXIDO NITROSO (L) */}
          {marks.n2o && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Óxido Nitroso (N₂O) — Quantidade (L)">
                  <input
                    className={inputBase}
                    inputMode="decimal"
                    placeholder="Ex.: 200"
                    value={equip.n2o_litros}
                    onChange={(e) =>
                      setEquipField("n2o_litros", maskDecimalBR(e.target.value, 4, 0))
                    }
                  />
                </Field>
              </div>
            </div>
          )}

          {/* Ventilação Mecânica */}
          {isMecanica && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Modo Ventilatório">
                  <select
                    className={selectBase}
                    value={equip.vent_modo}
                    onChange={(e) => setEquipField("vent_modo", e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {VENT_MODOS.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </Field>
                <Field label="FiO₂ (%)">
                  <input
                    className={inputBase}
                    inputMode="decimal"
                    placeholder="Ex.: 40"
                    value={equip.vent_fio2}
                    onChange={(e) => setEquipField("vent_fio2", maskDecimalBR(e.target.value, 3, 0))}
                  />
                </Field>
                <Field label="PEEP (cmH₂O)">
                  <input
                    className={inputBase}
                    inputMode="decimal"
                    placeholder="Ex.: 5"
                    value={equip.vent_peep}
                    onChange={(e) => setEquipField("vent_peep", maskDecimalBR(e.target.value, 2, 1))}
                  />
                </Field>

                <Field label="I : E">
                  <input
                    className={inputBase}
                    placeholder="Ex.: 1:2"
                    value={equip.vent_ie}
                    onChange={(e) => setEquipField("vent_ie", e.target.value.replace(/[^0-9:]/g, ""))}
                  />
                </Field>
                <Field label="FR (irpm)">
                  <input
                    className={inputBase}
                    inputMode="decimal"
                    placeholder="Ex.: 12"
                    value={equip.vent_rr}
                    onChange={(e) => setEquipField("vent_rr", maskDecimalBR(e.target.value, 2, 0))}
                  />
                </Field>

                {/* Vt quando VCV/SIMV */}
                {(modo.startsWith("VCV") || modo === "SIMV") && (
                  <Field label="Vt (mL)">
                    <input
                      className={inputBase}
                      inputMode="decimal"
                      placeholder="Ex.: 450"
                      value={equip.vent_vt_ml}
                      onChange={(e) => setEquipField("vent_vt_ml", maskDecimalBR(e.target.value, 4, 0))}
                    />
                  </Field>
                )}

                {/* Pinsp quando PCV/PSV */}
                {(modo.startsWith("PCV") || modo === "PSV") && (
                  <Field label="P. Inspiração (cmH₂O)">
                    <input
                      className={inputBase}
                      inputMode="decimal"
                      placeholder="Ex.: 18"
                      value={equip.vent_pinsp}
                      onChange={(e) => setEquipField("vent_pinsp", maskDecimalBR(e.target.value, 2, 0))}
                    />
                  </Field>
                )}
              </div>
            </div>
          )}

          {/* TCI / TIVA */}
          {marks.tci && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Modo da Bomba">
                  <select
                    className={selectBase}
                    value={equip.tci_modo}
                    onChange={(e) => setEquipField("tci_modo", e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {TCI_OPCOES.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </Field>

                {/* Alvo apenas para TCI (Schneider/Marsh) */}
                {(equip.tci_modo === "TCI - Schneider" || equip.tci_modo === "TCI - Marsh") && (
                  <>
                    <Field label="Alvo TCI">
                      <select
                        className={selectBase}
                        value={equip.tci_alvo}
                        onChange={(e) => setEquipField("tci_alvo", e.target.value)}
                      >
                        <option value="">Selecione...</option>
                        {TCI_ALVOS.map((a) => (
                          <option key={a}>{a}</option>
                        ))}
                      </select>
                    </Field>

                    {/* Concentração alvo por unidade */}
                    <Field label="Concentração alvo">
                      <div className="flex items-stretch gap-2">
                        <select
                          className={`${selectBase} w-28`}
                          value={equip.tci_conc_unit}
                          onChange={(e)=> setEquipField("tci_conc_unit", e.target.value)}
                        >
                          <option value="ng">ng</option>
                          <option value="mcg">mcg</option>
                          <option value="mg">mg</option>
                        </select>
                        <input
                          className={inputBase}
                          inputMode="decimal"
                          placeholder="Ex.: 2,5"
                          value={equip.tci_conc_val}
                          onChange={(e)=> onChangeTciConcVal(e.target.value)}
                          onBlur={onBlurTciConcVal}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Faixas: ng 0–10 • mcg 0–100 • mg 0,01–1000
                      </p>
                    </Field>
                  </>
                )}

                {/* Taxa mL/h apenas para TIVA volumétrica */}
                {equip.tci_modo === "TIVA volumétrica (mL/h)" && (
                  <Field label="Taxa (mL/h)">
                    <input
                      className={inputBase}
                      inputMode="decimal"
                      placeholder="Ex.: 20"
                      value={equip.tci_taxa_ml_h}
                      onChange={(e) => setEquipField("tci_taxa_ml_h", maskDecimalBR(e.target.value, 3, 0))}
                      onBlur={onBlurTciTaxa}
                    />
                    <p className="mt-1 text-[11px] text-slate-500">Faixa: 0–300 mL/h</p>
                  </Field>
                )}
              </div>
            </div>
          )}

          {/* BIS */}
          {marks.bis && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
              <Field label="Características do BIS (alvo/observações)">
                <input
                  className={inputBase}
                  placeholder="Ex.: Alvo 40–60; artefatos ausentes"
                  value={equip.bis_info}
                  onChange={(e) => setEquipField("bis_info", e.target.value)}
                />
              </Field>
            </div>
          )}

          {/* TOF */}
          {marks.tof && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Padrão">
                  <select
                    className={selectBase}
                    value={equip.tof_padrao}
                    onChange={(e) => setEquipField("tof_padrao", e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {TOF_PADROES.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Músculo">
                  <select
                    className={selectBase}
                    value={equip.tof_musculo}
                    onChange={(e) => setEquipField("tof_musculo", e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {TOF_MUSCULOS.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Razão TOF (%)">
                  <input
                    className={inputBase}
                    inputMode="decimal"
                    placeholder="Ex.: 90"
                    value={equip.tof_ratio}
                    onChange={(e) => setEquipField("tof_ratio", maskDecimalBR(e.target.value, 3, 0))}
                  />
                </Field>

                {/* Novos campos conforme padrão escolhido */}
                {equip.tof_padrao === "PTC" && (
                  <Field label="PTC (0–4)">
                    <select
                      className={selectBase}
                      value={equip.tof_ptc}
                      onChange={(e)=> setEquipField("tof_ptc", e.target.value)}
                    >
                      <option value="">Selecione…</option>
                      {[0,1,2,3,4].map(n=> <option key={n} value={String(n)}>{n}</option>)}
                    </select>
                  </Field>
                )}

                {equip.tof_padrao === "Tetânico" && (
                  <Field label="Tetânica aplicada">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className={checkboxBase}
                        checked={!!equip.tof_tetanica}
                        onChange={(e)=> setEquipField("tof_tetanica", e.target.checked)}
                      />
                      <span className="text-slate-700">Sim</span>
                    </label>
                  </Field>
                )}
              </div>
            </div>
          )}

          {/* HALOGENADOS (CAM) */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="Sevoflurano (CAM)">
                <input
                  className={inputBase}
                  inputMode="decimal"
                  placeholder="0,1 – 6,0"
                  value={equip.cam_sevo}
                  onChange={(e) =>
                    setEquipField("cam_sevo", maskDecimalBR(e.target.value, 1, 1))
                  }
                  onBlur={(e) => setEquipField("cam_sevo", clampCamBR(e.target.value))}
                />
              </Field>
              <Field label="Halotano (CAM)">
                <input
                  className={inputBase}
                  inputMode="decimal"
                  placeholder="0,1 – 6,0"
                  value={equip.cam_halotano}
                  onChange={(e) =>
                    setEquipField("cam_halotano", maskDecimalBR(e.target.value, 1, 1))
                  }
                  onBlur={(e) => setEquipField("cam_halotano", clampCamBR(e.target.value))}
                />
              </Field>
              <Field label="Isoflurano (CAM)">
                <input
                  className={inputBase}
                  inputMode="decimal"
                  placeholder="0,1 – 6,0"
                  value={equip.cam_isoflurano}
                  onChange={(e) =>
                    setEquipField("cam_isoflurano", maskDecimalBR(e.target.value, 1, 1))
                  }
                  onBlur={(e) => setEquipField("cam_isoflurano", clampCamBR(e.target.value))}
                />
              </Field>
              <Field label="Enflurano (CAM)">
                <input
                  className={inputBase}
                  inputMode="decimal"
                  placeholder="0,1 – 6,0"
                  value={equip.cam_enflurano}
                  onChange={(e) =>
                    setEquipField("cam_enflurano", maskDecimalBR(e.target.value, 1, 1))
                  }
                  onBlur={(e) => setEquipField("cam_enflurano", clampCamBR(e.target.value))}
                />
              </Field>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Intervalo recomendado: 0,1–6,0 CAM (valor arredondado para 1 casa decimal).
            </p>
          </div>
        </div>
      </SectionCard>
    </Page>
  );
}

/* ---------- Tabela reutilizável com botão excluir ---------- */
function ListTable({ headers, rows, onDelete, color = "emerald" }) {
  const headColor =
    color === "sky" ? "bg-sky-600" : color === "indigo" ? "bg-indigo-600" : "bg-emerald-600";

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
      <div className="overflow-x-auto bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className={`${headColor} text-white`}>
              {headers.map((h, idx) => (
                <th key={idx} className="px-3 py-2 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-slate-500" colSpan={headers.length}>
                  Nenhum item adicionado.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={i} className="odd:bg-slate-50">
                {r.map((c, ci) => (
                  <td key={ci} className="px-3 py-2">
                    {c || "—"}
                  </td>
                ))}
                <td className="px-3 py-2">
                  <button
                    onClick={() => onDelete(i)}
                    className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-rose-700"
                    title="Excluir"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
