import { useState, useMemo, useEffect } from "react";
import { Page, SectionCard, Field, inputBase, selectBase, checkboxBase } from "../components/ui";
import { ficha } from "../store/fichaStorage";

const MEDICACOES = ["Propofol","Midazolam","Fentanil","Morfina","Atracúrio","Rocurônio","Sevoflurano","Isoflurano","Lidocaína","Bupivacaína","Epinefrina","Atropina","Neostigmina","Sugamadex","Cetamina","Dexmedetomidina"];
const UNIDADES_ADMIN = ["mg","mcg","ml","UI"];
const VIAS_ADMIN = ["EV","IM","VO","SL","Inalatória"];
const UNIDADES_OUTRAS = ["mg","mcg","ml","UI","g","%"];
const VIAS_OUTRAS = ["EV","IM","VO","SL","Inalatória","Tópica","SC"];
const TIPOS_FLUIDO = ["Soroterapia","Plasma","Sangue/Derivados"];
const OP_FLUIDOS = { Soroterapia:["SF 0,9%","SG 5%","Ringer Lactato","Ringer Simples","SG 10%","Manitol 20%"], Plasma:["Plasma Fresco"], "Sangue/Derivados":["Concentrado de Hemácias","Plaquetas","Crioprecipitado"] };
const VOLUMES = ["250ml","500ml","1000ml"];

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
  });
  const [marks, setMarks] = useState({
    tci: !!s.meds.equipamentos?.tci, bis: !!s.meds.equipamentos?.bis,
    tof: !!s.meds.equipamentos?.tof, multiparam: !!s.meds.equipamentos?.multiparam, oxigenio: !!s.meds.equipamentos?.oxigenio,
  });

  const addAdm = () => {
    if (!adm.nome) return;
    const next = [...admList, adm];
    setAdmList(next);
    ficha.addMedAdministrada(adm);
    setAdm({ nome: "", dose: "", unidade: "mg", via: "EV", horario: "" });
  };
  const delAdm = (i) => { setAdmList((a) => a.filter((_, idx) => idx !== i)); ficha.removeMedAdministrada(i); };

  const addOut = () => {
    if (!out.nome) return;
    const next = [...outList, out];
    setOutList(next);
    ficha.addOutraMed(out);
    setOut({ nome: "", dose: "", unidade: "mg", via: "EV", horario: "" });
  };
  const delOut = (i) => { setOutList((a) => a.filter((_, idx) => idx !== i)); ficha.removeOutraMed(i); };

  const addFlu = () => {
    if (!flu.fluido) return;
    const next = [...fluList, flu];
    setFluList(next);
    ficha.addFluido(flu);
    setFlu({ tipo: "Soroterapia", fluido: "", volume: "250ml", horario: "" });
  };
  const delFlu = (i) => { setFluList((a) => a.filter((_, idx) => idx !== i)); ficha.removeFluido(i); };

  return (
    <Page>
      <SectionCard title="Medicações Administradas" tone="emerald">
        <div className="grid gap-4 sm:grid-cols-5">
          <Field label="Medicação">
            <select className={selectBase} value={adm.nome} onChange={(e) => setAdm({ ...adm, nome: e.target.value })}>
              <option value="">Selecione...</option>
              {MEDICACOES.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Dose"><input className={inputBase} value={adm.dose} onChange={(e) => setAdm({ ...adm, dose: e.target.value })} /></Field>
          <Field label="Unidade"><select className={selectBase} value={adm.unidade} onChange={(e) => setAdm({ ...adm, unidade: e.target.value })}>{UNIDADES_ADMIN.map((u)=><option key={u}>{u}</option>)}</select></Field>
          <Field label="Via"><select className={selectBase} value={adm.via} onChange={(e) => setAdm({ ...adm, via: e.target.value })}>{VIAS_ADMIN.map(v=><option key={v}>{v}</option>)}</select></Field>
          <Field label="Horário"><input type="time" className={inputBase} value={adm.horario} onChange={(e)=>setAdm({ ...adm, horario: e.target.value })}/></Field>
        </div>
        <div className="mt-4">
          <button onClick={addAdm} className="rounded-xl bg-emerald-600 px-5 py-2 font-semibold text-white shadow-sm hover:bg-emerald-700">＋ Adicionar Medicação</button>
        </div>
        <ListTable headers={["Medicação","Dose","Unid.","Via","Hora",""]} rows={admList.map(m=>[m.nome,m.dose,m.unidade,m.via,m.horario])} onDelete={delAdm}/>
      </SectionCard>

      <SectionCard title="Outras Medicações" tone="lavender">
        <div className="grid gap-4 sm:grid-cols-5">
          <Field label="Nome da Medicação"><input className={inputBase} value={out.nome} onChange={(e)=>setOut({ ...out, nome:e.target.value })} placeholder="Digite o nome da medicação"/></Field>
          <Field label="Dose"><input className={inputBase} value={out.dose} onChange={(e)=>setOut({ ...out, dose:e.target.value })}/></Field>
          <Field label="Unidade"><select className={selectBase} value={out.unidade} onChange={(e)=>setOut({ ...out, unidade:e.target.value })}>{UNIDADES_OUTRAS.map(u=><option key={u}>{u}</option>)}</select></Field>
          <Field label="Via"><select className={selectBase} value={out.via} onChange={(e)=>setOut({ ...out, via:e.target.value })}>{VIAS_OUTRAS.map(v=><option key={v}>{v}</option>)}</select></Field>
          <Field label="Horário"><input type="time" className={inputBase} value={out.horario} onChange={(e)=>setOut({ ...out, horario:e.target.value })}/></Field>
        </div>
        <div className="mt-4">
          <button onClick={addOut} className="rounded-xl bg-sky-600 px-5 py-2 font-semibold text-white shadow-sm hover:bg-sky-700">＋ Adicionar Outra Medicação</button>
        </div>
        <ListTable headers={["Medicação","Dose","Unid.","Via","Hora",""]} rows={outList.map(m=>[m.nome,m.dose,m.unidade,m.via,m.horario])} onDelete={delOut} color="sky"/>
      </SectionCard>

      <SectionCard title="Terapia de Fluidos" tone="sky">
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Tipo"><select className={selectBase} value={flu.tipo} onChange={(e)=>setFlu({ ...flu, tipo:e.target.value, fluido:"" })}>{TIPOS_FLUIDO.map(t=><option key={t}>{t}</option>)}</select></Field>
          <Field label="Fluido"><select className={selectBase} value={flu.fluido} onChange={(e)=>setFlu({ ...flu, fluido:e.target.value })}><option value="">Selecione...</option>{fluidosDoTipo.map(f=><option key={f}>{f}</option>)}</select></Field>
          <Field label="Volume"><select className={selectBase} value={flu.volume} onChange={(e)=>setFlu({ ...flu, volume:e.target.value })}>{VOLUMES.map(v=><option key={v}>{v}</option>)}</select></Field>
          <Field label="Horário"><input type="time" className={inputBase} value={flu.horario} onChange={(e)=>setFlu({ ...flu, horario:e.target.value })}/></Field>
        </div>
        <div className="mt-4">
          <button onClick={addFlu} className="rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white shadow-sm hover:bg-blue-700">＋ Adicionar Fluido</button>
        </div>
        <ListTable headers={["Tipo","Fluido","Volume","Hora",""]} rows={fluList.map(f=>[f.tipo,f.fluido,f.volume,f.horario])} onDelete={delFlu} color="indigo"/>
      </SectionCard>

      <SectionCard title="Equipamentos" tone="lavender">
        <div className="grid gap-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-3">
              {[
                ["tci","Bomba de Infusão TCI"],["bis","Monitor BIS"],["tof","Monitor TOF"],
                ["multiparam","Monitor Multiparamétrico (SPO₂, PNI, ECG)"],["oxigenio","OXIGÊNIO"],
              ].map(([k,label])=>(
                <label key={k} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className={checkboxBase}
                    checked={!!marks[k]}
                    onChange={() => {
                      const val = !marks[k];
                      setMarks((s)=>({ ...s, [k]: val }));
                      ficha.setEquip({ [k]: val });
                    }}
                  />
                  <span className="text-slate-700">{label}</span>
                </label>
              ))}
            </div>

            <div className="grid gap-4">
              <Field label="Aparelho de Anestesia">
                <input className={inputBase} value={equip.modelo} onChange={(e)=>{ const v=e.target.value; setEquip((s)=>({ ...s, modelo:v })); ficha.setEquip({ modelo:v }); }} placeholder="Modelo/marca do aparelho"/>
              </Field>
              <Field label="Outros Equipamentos">
                <input className={inputBase} value={equip.outros} onChange={(e)=>{ const v=e.target.value; setEquip((s)=>({ ...s, outros:v })); ficha.setEquip({ outros:v }); }} placeholder="Descreva outros equipamentos utilizados"/>
              </Field>
              <Field label="Modo de Ventilação">
                <select className={selectBase} value={equip.ventilacao} onChange={(e)=>{ const v=e.target.value; setEquip((s)=>({ ...s, ventilacao:v })); ficha.setEquip({ ventilacao:v }); }}>
                  <option>Espontânea</option><option>Assistida</option><option>Controlada</option>
                </select>
              </Field>
            </div>
          </div>
        </div>
      </SectionCard>
    </Page>
  );
}

function ListTable({ headers, rows, onDelete, color="emerald" }) {
  const headColor = color==="sky" ? "bg-sky-600" : color==="indigo" ? "bg-indigo-600" : "bg-emerald-600";
  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
      <div className="overflow-x-auto bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className={`${headColor} text-white`}>{headers.map((h, idx)=><th key={idx} className="px-3 py-2 text-left">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length===0 && <tr><td className="px-3 py-4 text-slate-500" colSpan={headers.length}>Nenhum item adicionado.</td></tr>}
            {rows.map((r,i)=>(
              <tr key={i} className="odd:bg-slate-50">
                {r.map((c,ci)=><td key={ci} className="px-3 py-2">{c || "—"}</td>)}
                <td className="px-3 py-2"><button onClick={()=>onDelete(i)} className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-rose-700" title="Excluir">Excluir</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
