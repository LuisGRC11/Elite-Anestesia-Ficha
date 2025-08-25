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

const pointStyleByKey = {
  pas: { pointStyle: "triangle", pointRotation: 0 },        // ▲
  pad: { pointStyle: "triangle", pointRotation: 180 },      // ▼
  capno: { pointStyle: "rect", pointRotation: 0 },          // ■
  spo2: { pointStyle: "triangle", pointRotation: 0 },       // ▲
  oximetria: { pointStyle: "triangle", pointRotation: 0 },  // ▲
};

const DEFAULTS = {
  pas:"120", pad:"80", fc:"72", spo2:"98", temp:"36.5",
  etco2:"35", fr:"12", pni:"120", oximetria:"98", capno:"35", saturacao:"98", ritmo:""
};
const STEPS = {
  pas:5, pad:5, fc:5, spo2:1, temp:0.1, etco2:1, fr:1, pni:5, oximetria:1, capno:1, saturacao:1
};
const LIMITS = {
  pas:[50, 250], pad:[30, 150], fc:[20, 220], spo2:[0, 100], temp:[30, 43],
  etco2:[10, 80], fr:[4, 60], pni:[50, 250], oximetria:[0, 100], capno:[10, 80], saturacao:[0, 100]
};

const parseHM = (hhmm) => {
  if (!/^\d{2}:\d{2}$/.test(hhmm || "")) return 0;
  const [h, m] = hhmm.split(":").map(Number);
  return ((h * 60 + m) % 1440 + 1440) % 1440;
};
const fmtHM = (mins) => {
  const mm = ((mins % 1440) + 1440) % 1440;
  const h = String(Math.floor(mm / 60)).padStart(2, "0");
  const m = String(mm % 60).padStart(2, "0");
  return `${h}:${m}`;
};
const nextSlot = (hhmm, stepMin) => fmtHM(parseHM(hhmm || "06:00") + stepMin);

export default function SinaisVitais() {
  const all = ficha.getAll();
  const initial = all?.vitais?.registros || [];

  const [step, setStep] = useState(10);
  const [form, setForm] = useState({ hora:"", ...DEFAULTS });
  const [registros, setRegistros] = useState(initial);

  const chartRef = useRef(null);

  const onChange = (e)=> setForm((f)=>({ ...f, [e.target.name]: e.target.value }));

  const bumpTime = (dir) => {
    const cur = form.hora || all?.cirurgia?.inicio || "06:00";
    setForm((f)=>({ ...f, hora: nextSlot(cur, dir * step) }));
  };

  const add = () => {
    if (!form.hora) return;
    const row = mapNum(form);
    setRegistros((a)=>[...a, row]);
    ficha.addVital(row);
    setForm(f=>({ ...f, hora: nextSlot(form.hora, step) }));
  };

  const labels = useMemo(()=>registros.map(r=>r.hora),[registros]);

  const mk = (label,key)=>({
    label,
    data: registros.map(r=>r[key]??null),
    borderColor: colors[key] || "#0ea5e9",
    backgroundColor: colors[key] || "#0ea5e9",
    ...(pointStyleByKey[key] || {}),
  });

  const chartData = useMemo(()=>({
    labels,
    datasets: [
      mk("PAS","pas"), mk("PAD","pad"), mk("FC","fc"), mk("SpO₂","spo2"), mk("Temp","temp"),
      mk("EtCO₂","etco2"), mk("FR","fr"), mk("PNI","pni"), mk("Oximetria","oximetria"),
      mk("Capnografia","capno"), mk("Saturação","saturacao"),
    ].map(ds=>({ ...ds, spanGaps:true, tension:0.3, pointRadius:4, pointHoverRadius:5, borderWidth:2 }))
  }),[labels,registros]);

  const chartOptions = {
    responsive:true,
    maintainAspectRatio:false,
    plugins:{ legend:{ position:"top", labels:{ usePointStyle: true } }, tooltip:{ mode:"nearest", intersect:false } },
    scales:{ x:{ grid:{ display:false } }, y:{ beginAtZero:true } }
  };

  // --- captura do gráfico -> localStorage (mesma chave do store)
  const captureChart = () => {
    try {
      const inst = chartRef.current;
      const canvas =
        inst?.canvas ||
        inst?.canvasRef?.current ||
        inst?.ctx?.canvas ||
        inst?.chart?.canvas ||
        null;
      const dataUrl =
        inst?.toBase64Image?.() ||
        canvas?.toDataURL?.("image/png") ||
        inst?.chart?.toBase64Image?.();
      if (dataUrl) localStorage.setItem(ficha.chartKey(), dataUrl);
    } catch (e) {
      console.warn("Não foi possível capturar o gráfico:", e);
    }
  };

  useEffect(() => {
    const id = setTimeout(captureChart, 150);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const id = setTimeout(captureChart, 120);
    return () => clearTimeout(id);
  }, [registros]);

  const onEnterAdd = (e) => {
    if (e.key === "Enter") { e.preventDefault(); add(); }
  };

  const stepSeconds = step * 60;

  return (
    <Page>
      <SectionCard title="Sinais Vitais — Hora a Hora" tone="emerald">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Horário">
            <div className="flex items-stretch gap-2">
              <button type="button" onClick={()=>bumpTime(-1)} className="select-none rounded-xl bg-slate-100 px-3 text-lg font-bold text-slate-700 shadow-sm active:scale-95">−</button>
              <input type="time" name="hora" step={stepSeconds} className={`${inputBase} text-center`} value={form.hora} onChange={onChange}/>
              <button type="button" onClick={()=>bumpTime(1)} className="select-none rounded-xl bg-slate-100 px-3 text-lg font-bold text-slate-700 shadow-sm active:scale-95">+</button>
              <select className={`${selectBase} w-28`} value={step} onChange={(e)=>setStep(Number(e.target.value))}>
                <option value={5}>5 min</option>
                <option value={10}>10 min</option>
              </select>
            </div>
            <p className="mt-1 text-xs text-slate-500">Digite qualquer horário e use os botões/intervalo.</p>
          </Field>

          <Stepper label="PAS (mmHg)" name="pas" value={form.pas} onChange={onChange} step={STEPS.pas} limits={LIMITS.pas}/>
          <Stepper label="PAD (mmHg)" name="pad" value={form.pad} onChange={onChange} step={STEPS.pad} limits={LIMITS.pad}/>
          <Stepper label="FC (bpm)"  name="fc"  value={form.fc}  onChange={onChange} step={STEPS.fc}  limits={LIMITS.fc}/>
          <Stepper label="SpO₂ (%)"  name="spo2" value={form.spo2} onChange={onChange} step={STEPS.spo2} limits={LIMITS.spo2}/>
          <Stepper label="Temp (°C)" name="temp" value={form.temp} onChange={onChange} step={STEPS.temp} limits={LIMITS.temp} decimals={1}/>
          <Stepper label="EtCO₂ (mmHg)" name="etco2" value={form.etco2} onChange={onChange} step={STEPS.etco2} limits={LIMITS.etco2}/>
          <Stepper label="FR (irpm)" name="fr" value={form.fr} onChange={onChange} step={STEPS.fr} limits={LIMITS.fr}/>
          <Stepper label="PNI (mmHg)" name="pni" value={form.pni} onChange={onChange} step={STEPS.pni} limits={LIMITS.pni}/>
          <Stepper label="Oximetria (%)" name="oximetria" value={form.oximetria} onChange={onChange} step={STEPS.oximetria} limits={LIMITS.oximetria}/>
          <Stepper label="Capnografia (mmHg)" name="capno" value={form.capno} onChange={onChange} step={STEPS.capno} limits={LIMITS.capno}/>
          <Stepper label="Saturação (%)" name="saturacao" value={form.saturacao} onChange={onChange} step={STEPS.saturacao} limits={LIMITS.saturacao} onKeyDown={onEnterAdd}/>

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
          <button onClick={add} className="rounded-xl bg-emerald-600 px-5 py-2 font-semibold text-white shadow-sm hover:bg-emerald-700">
            ＋ Adicionar
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Registro Detalhado" tone="sky">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-emerald-600 text-white">
                {["Hora","PAS","PAD","FC","SpO₂","Temp","EtCO₂","FR","PNI","Oxim","Capno","Sat","Ritmo"].map(h=>(
                  <th key={h} className="px-3 py-2 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registros.length===0 && (
                <tr><td className="px-3 py-4 text-slate-500" colSpan={13}>Nenhum registro ainda.</td></tr>
              )}
              {registros.map((r,i)=>(
                <tr key={i} className="odd:bg-slate-50">
                  {["hora","pas","pad","fc","spo2","temp","etco2","fr","pni","oximetria","capno","saturacao","ritmo"].map(k=>(
                    <td key={k} className="px-3 py-2">{r[k] ?? "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Gráfico de Sinais Vitais" tone="lavender">
        <div className="h-72 sm:h-80">
          <Line ref={(node) => (chartRef.current = node)} data={chartData} options={chartOptions} />
        </div>
      </SectionCard>
    </Page>
  );
}

function Stepper({ label, name, value, onChange, step = 1, limits = [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY], decimals = 0, onKeyDown }) {
  const [min, max] = limits;
  const parsed = parseFloat(String(value).replace(",", "."));
  const current = isNaN(parsed) ? "" : parsed;

  const bump = (dir) => {
    const base = isNaN(parsed) ? parseFloat(DEFAULTS[name] || "0") : parsed;
    let next = base + dir * step;
    if (Number.isFinite(min)) next = Math.max(min, next);
    if (Number.isFinite(max)) next = Math.min(max, next);
    const fixed = decimals > 0 ? next.toFixed(decimals) : String(Math.round(next));
    onChange({ target: { name, value: fixed } });
  };

  return (
    <Field label={label}>
      <div className="flex items-stretch gap-2">
        <button type="button" onClick={()=>bump(-1)} className="select-none rounded-xl bg-slate-100 px-3 text-lg font-bold text-slate-700 shadow-sm active:scale-95" aria-label={`Diminuir ${label}`}>−</button>
        <input name={name} type="number" inputMode="decimal" step={decimals > 0 ? String(step) : "1"} className={`${inputBase} text-center`} value={value} onChange={onChange} onKeyDown={onKeyDown}/>
        <button type="button" onClick={()=>bump(1)} className="select-none rounded-xl bg-slate-100 px-3 text-lg font-bold text-slate-700 shadow-sm active:scale-95" aria-label={`Aumentar ${label}`}>+</button>
      </div>
      <p className="mt-1 text-[11px] text-slate-500">Passo: {step} {Number.isFinite(min)&&Number.isFinite(max) ? `• Faixa ${min}–${max}` : ""}</p>
    </Field>
  );
}

const toNum = (v)=> v===""||v==null ? null : Number.parseFloat(String(v).replace(",",".")); 
const mapNum = (f)=>({
  ...f,
  pas:toNum(f.pas), pad:toNum(f.pad), fc:toNum(f.fc), spo2:toNum(f.spo2), temp:toNum(f.temp),
  etco2:toNum(f.etco2), fr:toNum(f.fr), pni:toNum(f.pni), oximetria:toNum(f.oximetria),
  capno:toNum(f.capno), saturacao:toNum(f.saturacao),
});
