import { useMemo, useState } from "react";
import { Page, SectionCard, Field, inputBase, selectBase } from "../components/ui";
import { ficha } from "../store/fichaStorage";

const DRUG_PRESETS = {
  Propofol:"10mg/ml", Midazolam:"5mg/ml", Fentanil:"50mcg/ml", Morfina:"10mg/ml",
  Atracúrio:"10mg/ml", Rocurônio:"10mg/ml", Sevoflurano:"100%", Isoflurano:"100%",
  Lidocaína:"2%", Bupivacaína:"0,5%", Epinefrina:"1mg/ml", Atropina:"1mg/ml",
  Neostigmina:"0,5mg/ml", Sugamadex:"100mg/ml", Cetamina:"50mg/ml"
};
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

const MATERIALS = [
  { nome:"Cateter nasal" },
  { nome:"Látex oxigênio" },
  { nome:"Equipo" },
  { nome:"Polifix" },
  { nome:"Torneirinha (multivias)", variantes:["2 vias","3 vias"] },
  { nome:"Cateter venoso (Abocath)", variantes:["24G","22G","20G"] },
  { nome:"Esparadrapo" },
  { nome:"Micropore" },
  { nome:"Extensor de equipo" },
  { nome:"Seringa", variantes:["10 mL","20 mL","60 mL"] },
  { nome:"Guedel", variantes:["#2","#3","#4"] },
  { nome:"Nasofaríngea" },
  { nome:"Tubo endotraqueal", variantes:["7.0","7.5","8.0"] },
  { nome:"Máscara laríngea", variantes:["1","2","3","4","5"] },
  { nome:"Outro" },
];

export default function RelatorioRPA() {
  const s = ficha.getAll();

  const [drugForm, setDrugForm] = useState({ nome:"", outro:"", conc:"", qtd:"" });
  const [drugList, setDrugList] = useState(s.rpa.drogas || []);

  function onPickDrug(name){
    if (name === "Outro") {
      setDrugForm(f=>({ ...f, nome:name, outro:"", conc:"" }));
    } else {
      setDrugForm(f=>({ ...f, nome:name, outro:"", conc: DRUG_PRESETS[name] ?? "" }));
    }
  }
  function onChangeDrug(e){
    const { name, value } = e.target;
    setDrugForm(f=>({ ...f, [name]: value }));
  }
  function addDrug(){
    const nomeFinal = drugForm.nome === "Outro"
      ? (drugForm.outro || "").trim()
      : drugForm.nome;
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

  const [matForm, setMatForm] = useState({ item:"", variante:"", outro:"", qtd:"" });
  const [matList, setMatList] = useState(s.rpa.materiais || []);
  const variantesDisponiveis = useMemo(()=>{
    const m = MATERIALS.find(x=>x.nome===matForm.item);
    return m?.variantes || [];
  },[matForm.item]);

  function addMaterial(){
    const base = MATERIALS.find(x=>x.nome===matForm.item);
    const nomeFinal = base?.nome==="Outro" ? (matForm.outro || "").trim() : matForm.item;
    if (!nomeFinal || !matForm.qtd) return;
    const row = { item:nomeFinal, variante:(variantesDisponiveis.length? matForm.variante : ""), qtd:matForm.qtd };
    const next = [...matList, row];
    setMatList(next);
    ficha.setRpa({ materiais: next });
    setMatForm({ item:"", variante:"", outro:"", qtd:"" });
  }
  function delMaterial(i){
    const next = matList.filter((_,idx)=>idx!==i);
    setMatList(next);
    ficha.setRpa({ materiais: next });
  }

  const [resumo, setResumo] = useState(s.rpa.resumo || "");
  const [observ, setObserv] = useState(s.rpa.observacoes || "");
  const [destino, setDestino] = useState(s.rpa.destino || "");
  const [aldrete, setAldrete] = useState({
    atividade: s.rpa.aldrete?.atividade || 0,
    respiracao: s.rpa.aldrete?.respiracao || 0,
    circulacao: s.rpa.aldrete?.circulacao || 0,
    consciencia: s.rpa.aldrete?.consciencia || 0,
    saturacao: s.rpa.aldrete?.saturacao || 0,
  });

  const total = useMemo(
    ()=> Object.entries(aldrete).reduce((sum,[k,idx])=> sum + (ALDRETE[k].options[idx]?.s ?? 0), 0),
    [aldrete]
  );
  const risk = classify(total);

  return (
    <Page>
      {/* =================== FICHÁRIO DE GASTOS =================== */}
      <SectionCard title="Fichário de Gastos — Medicações" tone="emerald">
        <p className="text-xs sm:text-sm text-slate-600 mb-3">
          Selecione uma medicação (concentração padrão) ou escolha <b>Outro</b>, informe a <b>Quantidade</b> e clique em <i>Adicionar</i>.
        </p>

        <div className="grid gap-4 sm:grid-cols-[2fr,2fr,1.5fr,1.5fr,auto] items-end">
          <Field label="Droga (lista)">
            <select className={selectBase} name="nome" value={drugForm.nome} onChange={(e)=>onPickDrug(e.target.value)}>
              <option value="">Selecione…</option>
              {DRUG_NAMES.map(n=><option key={n}>{n}</option>)}
              <option>Outro</option>
            </select>
          </Field>

          {drugForm.nome === "Outro" ? (
            <Field label="Nome do medicamento">
              <input className={inputBase} name="outro" value={drugForm.outro} onChange={onChangeDrug} placeholder="Digite o nome"/>
            </Field>
          ) : (
            <div className="hidden sm:block" />
          )}

          <Field label="Concentração">
            <input className={inputBase} name="conc" value={drugForm.conc} onChange={onChangeDrug} placeholder="Ex.: 10mg/ml"/>
          </Field>

          <Field label="Quantidade">
            <input className={inputBase} name="qtd" value={drugForm.qtd} onChange={onChangeDrug} placeholder="Ex.: 2 mL, 50 mg"/>
          </Field>

          <button onClick={addDrug} className="h-[42px] rounded-xl bg-emerald-600 px-4 font-semibold text-white shadow-sm hover:bg-emerald-700">
            Adicionar
          </button>
        </div>

        <TableSimple
          head={["Droga","Concentração","Quantidade",""]}
          rows={drugList.map(d=>[d.nome, d.conc || "—", d.qtd || "—"])}
          onDelete={removeDrug}
        />
      </SectionCard>

      <SectionCard title="Fichário de Gastos — Materiais" tone="sky">
        <div className="grid gap-4 sm:grid-cols-[2fr,2fr,1fr,auto] items-end">
          <Field label="Material">
            <select className={selectBase} value={matForm.item} onChange={(e)=> setMatForm(f=>({ ...f, item:e.target.value, variante:"", outro:"" }))}>
              <option value="">Selecione…</option>
              {MATERIALS.map(m=> <option key={m.nome}>{m.nome}</option>)}
            </select>
          </Field>

          {matForm.item==="Outro" ? (
            <Field label="Outro (descrição)">
              <input className={inputBase} value={matForm.outro} onChange={(e)=> setMatForm(f=>({ ...f, outro:e.target.value }))} placeholder="Descreva o material"/>
            </Field>
          ) : (
            <Field label="Variante">
              <select className={selectBase} disabled={(MATERIALS.find(x=>x.nome===matForm.item)?.variantes||[]).length===0}
                      value={matForm.variante}
                      onChange={(e)=> setMatForm(f=>({ ...f, variante:e.target.value }))}>
                {(MATERIALS.find(x=>x.nome===matForm.item)?.variantes||[]).length===0 ? (
                  <option value="">—</option>
                ) : (
                  <>
                    <option value="">Selecione…</option>
                    {(MATERIALS.find(x=>x.nome===matForm.item)?.variantes||[]).map(v=> <option key={v}>{v}</option>)}
                  </>
                )}
              </select>
            </Field>
          )}

          <Field label="Qtd.">
            <input className={inputBase} inputMode="numeric" placeholder="Ex.: 1"
                   value={matForm.qtd}
                   onChange={(e)=> setMatForm(f=>({ ...f, qtd: e.target.value.replace(/[^\d]/g,"") }))}/>
          </Field>

          <button onClick={addMaterial} className="h-[42px] rounded-xl bg-sky-600 px-4 font-semibold text-white shadow-sm hover:bg-sky-700">
            Adicionar
          </button>
        </div>

        <TableSimple
          head={["Item","Variante","Qtd.",""]}
          rows={matList.map(m=>[m.item, m.variante || "—", m.qtd || "—"])}
          onDelete={delMaterial}
          headColor="sky"
        />
      </SectionCard>

      {/* =================== SAÍDA DA RPA =================== */}
      <SectionCard title="Saída da RPA (Recuperação Pós-Anestésica)" tone="lavender">
        <Field label="Resumo da Ficha">
          <textarea rows={4} className={`${inputBase} h-auto`} placeholder="Resumo geral do procedimento..."
                    value={resumo} onChange={(e)=>{ setResumo(e.target.value); ficha.setRpa({ resumo: e.target.value }); }}/>
        </Field>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {Object.entries(ALDRETE).map(([key,cat])=>(
            <Field key={key} label={cat.label}>
              <select className={selectBase} value={aldrete[key]}
                      onChange={(e)=>{ const idx=Number(e.target.value); setAldrete(s=>({ ...s, [key]: idx })); ficha.setAldreteField(key, idx); }}>
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
          <textarea rows={4} className={`${inputBase} h-auto`} placeholder="Descreva intercorrências..."
                    value={observ} onChange={(e)=>{ setObserv(e.target.value); ficha.setRpa({ observacoes: e.target.value }); }}/>
        </Field>

        <Field label="Destino do paciente">
          <select className={selectBase} value={destino} onChange={(e)=>{ setDestino(e.target.value); ficha.setRpa({ destino: e.target.value }); }}>
            <option value="">Selecione…</option>
            <option>Alta pra casa</option>
            <option>Enfermaria</option>
            <option>Apartamento</option>
            <option>REMOÇÃO PARA UTI</option>
          </select>
        </Field>
      </SectionCard>
    </Page>
  );
}

/* ------- tabelinha simples com excluir ------- */
function TableSimple({ head, rows, onDelete, headColor="emerald" }) {
  const headClass = headColor==="sky" ? "bg-sky-600" : headColor==="indigo" ? "bg-indigo-600" : "bg-emerald-600";
  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
      <div className="overflow-x-auto bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className={`${headClass} text-white`}>
              {head.map((h,i)=><th key={i} className="px-3 py-2 text-left">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length===0 && <tr><td className="px-3 py-4 text-slate-500" colSpan={head.length}>Nenhum item adicionado.</td></tr>}
            {rows.map((r,i)=>(
              <tr key={i} className="odd:bg-slate-50">
                {r.map((c,ci)=><td key={ci} className="px-3 py-2">{c}</td>)}
                <td className="px-3 py-2">
                  <button onClick={()=>onDelete(i)} className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
