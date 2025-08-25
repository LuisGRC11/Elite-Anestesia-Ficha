import { useMemo, useState, useEffect } from "react";
import { Page, SectionCard, Field, inputBase, selectBase } from "../components/ui";
import { ficha } from "../store/fichaStorage";

const DRUG_PRESETS = { Propofol:"10mg/ml", Midazolam:"5mg/ml", Fentanil:"50mcg/ml", Morfina:"10mg/ml", Atracúrio:"10mg/ml", Rocurônio:"10mg/ml", Sevoflurano:"100%", Isoflurano:"100%", Lidocaína:"2%", Bupivacaína:"0,5%", Epinefrina:"1mg/ml", Atropina:"1mg/ml", Neostigmina:"0,5mg/ml", Sugamadex:"100mg/ml", Cetamina:"50mg/ml" };
const DRUG_NAMES = Object.keys(DRUG_PRESETS);
const ALDRETE = {
  atividade:{ label:"Atividade (0–2)", options:[{t:"0 - Não move membros",s:0},{t:"1 - Move 2 membros",s:1},{t:"2 - Move 4 membros",s:2}]},
  respiracao:{ label:"Respiração (0–2)", options:[{t:"0 - Apnéia",s:0},{t:"1 - Dispneia/respiração limitada",s:1},{t:"2 - Respiração normal",s:2}]},
  circulacao:{ label:"Circulação (0–2)", options:[{t:"0 - PA ±50% do pré-operatório",s:0},{t:"1 - PA ±20–50% do pré-operatório",s:1},{t:"2 - PA ±20% do pré-operatório",s:2}]},
  consciencia:{ label:"Consciência (0–2)", options:[{t:"0 - Não responde",s:0},{t:"1 - Desperta com estímulo",s:1},{t:"2 - Totalmente desperto",s:2}]},
  saturacao:{ label:"Saturação O₂ (0–2)", options:[{t:"0 - SpO₂ < 90% com O₂",s:0},{t:"1 - SpO₂ ≥ 90% com O₂",s:1},{t:"2 - SpO₂ ≥ 92% em ar ambiente",s:2}]},
};
function classify(total){
  if (total <= 3) return { label:"Risco muito alto • Cuidados intensivos", chip:"bg-rose-100 text-rose-800" };
  if (total <= 6) return { label:"Risco alto • Observação", chip:"bg-orange-100 text-orange-800" };
  if (total <= 8) return { label:"Risco moderado", chip:"bg-amber-100 text-amber-800" };
  return { label:"Baixo risco • Apto(a) à alta da RPA", chip:"bg-emerald-100 text-emerald-800" };
}

export default function RelatorioRPA() {
  const s = ficha.getAll();

  const [drugForm, setDrugForm] = useState({ nome:"", outro:"", conc:"", qtd:"" });
  const [drugList, setDrugList] = useState(s.rpa.drogas || []);

  const [resumo, setResumo] = useState(s.rpa.resumo || "");
  const [observ, setObserv] = useState(s.rpa.observacoes || "");
  const [aldrete, setAldrete] = useState({
    atividade: s.rpa.aldrete?.atividade || 0,
    respiracao: s.rpa.aldrete?.respiracao || 0,
    circulacao: s.rpa.aldrete?.circulacao || 0,
    consciencia: s.rpa.aldrete?.consciencia || 0,
    saturacao: s.rpa.aldrete?.saturacao || 0,
  });

  function onPickDrug(name){ setDrugForm(f=>({ ...f, nome:name, conc: DRUG_PRESETS[name] ?? f.conc })); }
  function onChangeDrug(e){ const { name, value } = e.target; setDrugForm(f=>({ ...f, [name]: value })); }
  function addDrug(){
    const nomeFinal = (drugForm.outro || "").trim() || drugForm.nome;
    if (!nomeFinal) return;
    const d = { nome:nomeFinal, conc:drugForm.conc, qtd:drugForm.qtd };
    const next = [...drugList, d];
    setDrugList(next);
    ficha.addRpaDroga(d);
    setDrugForm({ nome:"", outro:"", conc:"", qtd:"" });
  }
  function removeDrug(idx){
    setDrugList(a => a.filter((_,i)=>i!==idx));
    ficha.removeRpaDroga(idx);
  }

  const total = useMemo(()=> Object.entries(aldrete).reduce((sum,[k,idx])=> sum + (ALDRETE[k].options[idx]?.s ?? 0), 0), [aldrete]);
  const risk = classify(total);

  return (
    <Page>
      <SectionCard title="Fichário de Drogas" tone="emerald">
        <p className="text-xs sm:text-sm text-slate-600 mb-3">
          Selecione uma droga (concentração padrão) ou digite um <b>Outro medicamento</b>, informe a <b>Quantidade</b> e clique em <i>Adicionar</i>.
        </p>
        <div className="grid gap-4 sm:grid-cols-[2fr,2fr,1.5fr,1.5fr,auto] items-end">
          <Field label="Droga (lista)">
            <select className={selectBase} name="nome" value={drugForm.nome} onChange={(e)=>onPickDrug(e.target.value)}>
              <option value="">Selecione…</option>
              {DRUG_NAMES.map(n=><option key={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="Outro medicamento (não está na lista)">
            <input className={inputBase} name="outro" value={drugForm.outro} onChange={onChangeDrug} placeholder="Digite o nome"/>
          </Field>
          <Field label="Concentração">
            <input className={inputBase} name="conc" value={drugForm.conc} onChange={onChangeDrug} placeholder="Ex.: 10mg/ml"/>
          </Field>
          <Field label="Quantidade">
            <input className={inputBase} name="qtd" value={drugForm.qtd} onChange={onChangeDrug} placeholder="Ex.: 2mL, 50mg"/>
          </Field>
          <button onClick={addDrug} className="h-[42px] rounded-xl bg-emerald-600 px-4 font-semibold text-white shadow-sm hover:bg-emerald-700">Adicionar</button>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
          <div className="overflow-x-auto bg-white">
            <table className="min-w-full text-sm">
              <thead><tr className="bg-emerald-600 text-white">{["Droga","Concentração","Quantidade",""].map(h=><th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead>
              <tbody>
                {drugList.length===0 && <tr><td className="px-3 py-4 text-slate-500" colSpan={4}>Nenhuma droga adicionada.</td></tr>}
                {drugList.map((d,i)=>(
                  <tr key={`${d.nome}-${i}`} className="odd:bg-slate-50">
                    <td className="px-3 py-2">{d.nome}</td>
                    <td className="px-3 py-2">{d.conc || "—"}</td>
                    <td className="px-3 py-2">{d.qtd || "—"}</td>
                    <td className="px-3 py-2"><button onClick={()=>removeDrug(i)} className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700">Excluir</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Saída da RPA (Recuperação Pós-Anestésica)" tone="lavender">
        <Field label="Resumo da Ficha">
          <textarea rows={4} className={`${inputBase} h-auto`} placeholder="Resumo geral do procedimento..." value={resumo} onChange={(e)=>{ setResumo(e.target.value); ficha.setRpa({ resumo: e.target.value }); }}/>
        </Field>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {Object.entries(ALDRETE).map(([key,cat])=>(
            <Field key={key} label={cat.label}>
              <select
                className={selectBase}
                value={aldrete[key]}
                onChange={(e)=>{ const idx=Number(e.target.value); setAldrete(s=>({ ...s, [key]: idx })); ficha.setAldreteField(key, idx); }}
              >
                {cat.options.map((op, idx)=><option key={idx} value={idx}>{op.t}</option>)}
              </select>
            </Field>
          ))}
          <div className="sm:col-span-2">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between">
              <div className="text-sm font-semibold text-amber-900">Pontuação Total: {total}/10</div>
              <div className={`rounded-full px-3 py-1 text-xs font-semibold ${risk.chip}`}>{risk.label}</div>
            </div>
          </div>
        </div>

        <Field label="Intercorrências ou Alterações na RPA">
          <textarea rows={4} className={`${inputBase} h-auto`} placeholder="Descreva intercorrências..." value={observ} onChange={(e)=>{ setObserv(e.target.value); ficha.setRpa({ observacoes: e.target.value }); }}/>
        </Field>
      </SectionCard>
    </Page>
  );
}
