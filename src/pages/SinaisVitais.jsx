import { useMemo, useState, useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend,
} from "chart.js";
import { Page, SectionCard, Field, inputBase, selectBase } from "../components/ui";
import { ficha } from "../store/fichaStorage";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const colors = {
  pas:"#ef4444", pad:"#f97316", fc:"#0ea5e9", spo2:"#10b981", temp:"#8b5cf6",
  etco2:"#facc15", fr:"#ec4899", pni:"#06b6d4", oximetria:"#f59e0b", capno:"#14b8a6", saturacao:"#9333ea",
};

export default function SinaisVitais() {
  // carregar registros do storage
  const initial = (ficha.getAll()?.vitais?.registros) || [];
  const [form, setForm] = useState({ hora:"", pas:"", pad:"", fc:"", spo2:"", temp:"", etco2:"", fr:"", pni:"", oximetria:"", capno:"", saturacao:"", ritmo:"" });
  const [registros, setRegistros] = useState(initial);

  const chartRef = useRef(null);

  const onChange = (e)=> setForm((f)=>({ ...f, [e.target.name]: e.target.value }));

  const add = () => {
    if (!form.hora) return;
    const row = mapNum(form);
    setRegistros((a)=>[...a, row]);
    ficha.addVital(row);
    setForm(f=>({ ...f, pas:"", pad:"", fc:"", spo2:"", temp:"", etco2:"", fr:"", pni:"", oximetria:"", capno:"", saturacao:"" }));
  };

  const labels = useMemo(()=>registros.map(r=>r.hora),[registros]);
  const mk = (label,key)=>({ label, data:registros.map(r=>r[key]??null), borderColor:colors[key]||"#0ea5e9", backgroundColor:colors[key]||"#0ea5e9" });

  const chartData = useMemo(()=>({
    labels,
    datasets:[
      mk("PAS","pas"), mk("PAD","pad"), mk("FC","fc"), mk("SpO₂","spo2"), mk("Temp","temp"),
      mk("EtCO₂","etco2"), mk("FR","fr"), mk("PNI","pni"), mk("Oximetria","oximetria"),
      mk("Capnografia","capno"), mk("Saturação","saturacao"),
    ].map(ds=>({ ...ds, spanGaps:true, tension:0.3, pointRadius:4, pointHoverRadius:5, borderWidth:2 }))
  }),[labels,registros]);

  const chartOptions = { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:"top" }, tooltip:{ mode:"nearest", intersect:false }}, scales:{ x:{ grid:{ display:false } }, y:{ beginAtZero:true } } };

  // salvar uma imagem do gráfico no localStorage para o PDF
  useEffect(() => {
    // esperar o chart renderizar
    const t = setTimeout(() => {
      const chart = chartRef.current;
      try {
        const dataUrl =
          chart?.toBase64Image?.() ??
          chart?.canvas?.toDataURL?.("image/png");
        if (dataUrl) {
          localStorage.setItem("ficha-anestesica:v1:chart", dataUrl);
        }
      } catch (e) {
        console.warn("Não foi possível capturar o gráfico:", e);
      }
    }, 120);
    return () => clearTimeout(t);
  }, [registros]);

  return (
    <Page>
      <SectionCard title="Sinais Vitais — Hora a Hora" tone="emerald">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Horário"><input type="time" name="hora" className={inputBase} value={form.hora} onChange={onChange}/></Field>
          <Field label="PAS"><input name="pas" className={inputBase} placeholder="120" value={form.pas} onChange={onChange}/></Field>
          <Field label="PAD"><input name="pad" className={inputBase} placeholder="80" value={form.pad} onChange={onChange}/></Field>
          <Field label="FC"><input name="fc" className={inputBase} placeholder="72" value={form.fc} onChange={onChange}/></Field>
          <Field label="SpO₂"><input name="spo2" className={inputBase} placeholder="98" value={form.spo2} onChange={onChange}/></Field>
          <Field label="Temp"><input name="temp" className={inputBase} placeholder="36.5" value={form.temp} onChange={onChange}/></Field>
          <Field label="EtCO₂"><input name="etco2" className={inputBase} placeholder="35" value={form.etco2} onChange={onChange}/></Field>
          <Field label="FR"><input name="fr" className={inputBase} placeholder="12" value={form.fr} onChange={onChange}/></Field>
          <Field label="PNI"><input name="pni" className={inputBase} placeholder="120" value={form.pni} onChange={onChange}/></Field>
          <Field label="Oximetria"><input name="oximetria" className={inputBase} placeholder="98" value={form.oximetria} onChange={onChange}/></Field>
          <Field label="Capnografia"><input name="capno" className={inputBase} placeholder="35" value={form.capno} onChange={onChange}/></Field>
          <Field label="Saturação"><input name="saturacao" className={inputBase} placeholder="98" value={form.saturacao} onChange={onChange}/></Field>
          <div className="sm:col-span-3">
            <Field label="Ritmo Cardíaco">
              <select name="ritmo" className={selectBase} value={form.ritmo} onChange={onChange}>
                <option value="">Selecione...</option>
                <option>Sinusal</option>
                <option>Taquicardia Sinusal</option>
                <option>Bradicardia Sinusal</option>
                <option>Fibrilação Atrial</option>
                <option>Flutter Atrial</option>
                <option>Extrassístoles</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="mt-4">
          <button onClick={add} className="rounded-xl bg-emerald-600 px-5 py-2 font-semibold text-white shadow-sm hover:bg-emerald-700">＋ Adicionar</button>
        </div>
      </SectionCard>

      <SectionCard title="Registro Detalhado" tone="sky">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-emerald-600 text-white">
                {["Hora","PAS","PAD","FC","SpO₂","Temp","EtCO₂","FR","PNI","Oxim","Capno","Sat","Ritmo"].map(h=><th key={h} className="px-3 py-2 text-left">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {registros.length===0 && <tr><td className="px-3 py-4 text-slate-500" colSpan={13}>Nenhum registro ainda.</td></tr>}
              {registros.map((r,i)=>(
                <tr key={i} className="odd:bg-slate-50">
                  {["hora","pas","pad","fc","spo2","temp","etco2","fr","pni","oximetria","capno","saturacao","ritmo"].map(k=><td key={k} className="px-3 py-2">{r[k] ?? "—"}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Gráfico de Sinais Vitais" tone="lavender">
        <div className="h-72 sm:h-80">
          <Line ref={chartRef} data={chartData} options={chartOptions} />
        </div>
      </SectionCard>
    </Page>
  );
}

const toNum = (v)=> v===""||v==null ? null : Number.parseFloat(String(v).replace(",","."));
const mapNum = (f)=>({ ...f, pas:toNum(f.pas), pad:toNum(f.pad), fc:toNum(f.fc), spo2:toNum(f.spo2), temp:toNum(f.temp), etco2:toNum(f.etco2), fr:toNum(f.fr), pni:toNum(f.pni), oximetria:toNum(f.oximetria), capno:toNum(f.capno), saturacao:toNum(f.saturacao) });
