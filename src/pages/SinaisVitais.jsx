import { useMemo, useState, useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend,
} from "chart.js";
import { Page, SectionCard, Field, inputBase, selectBase } from "../components/ui";
import { ficha } from "../store/fichaStorage";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

/* ====== Estilo ====== */
const COL_BLUE_MAIN   = "#2563eb"; // PAS
const COL_BLUE_LIGHT  = "#60a5fa"; // PAD
const COL_RED         = "#ef4444"; // FC

/* Plugin para rótulos numéricos */
const ValueLabelsPlugin = {
  id: "valueLabels",
  afterDatasetsDraw(chart) {
    const { ctx, data } = chart;
    ctx.save();
    ctx.font = "11px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    data.datasets.forEach((ds, di) => {
      const meta = chart.getDatasetMeta(di);
      if (!meta?.data) return;
      meta.data.forEach((el, i) => {
        const val = ds.data[i];
        if (val == null || Number.isNaN(val)) return;
        let offY = -12;
        if (ds.label === "PAD") offY = 14;
        const txt = ds.label === "FC"
          ? String(val)
          : Number(val).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        ctx.fillStyle = ds.borderColor || "#0f172a";
        ctx.fillText(txt, el.x, el.y + offY);
      });
    });
    ctx.restore();
  }
};
ChartJS.register(ValueLabelsPlugin);

/* Defaults/limites apenas do que usamos */
const DEFAULTS = { pas:"120", pad:"80", fc:"72", spo2:"98", temp:"36.5", etco2:"35", ritmo:"" };
const STEPS    = { pas:5, pad:5, fc:5, spo2:1, temp:0.1, etco2:1 };
const LIMITS   = {
  pas:[50,250], pad:[30,150], fc:[20,220],
  spo2:[0,100], temp:[30,43], etco2:[10,80]
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

  const del = (i) => {
    setRegistros((arr) => arr.filter((_, idx) => idx !== i));
    ficha.removeVital(i);
  };

  const labels = useMemo(()=>registros.map(r=>r.hora),[registros]);

  /* Datasets: PAS/PAD conectados; FC só pontos */
  const mk = (label, key, color, extra={}) => ({
    label,
    yAxisID: key === "fc" ? "yFC" : "yPressao",
    data: registros.map(r=>r[key]??null),
    borderColor: color,
    backgroundColor: color,
    pointBackgroundColor: "#ffffff",
    pointBorderWidth: 2,
    pointRadius: 4.5,
    pointHoverRadius: 6,
    cubicInterpolationMode: "monotone",
    tension: 0.25,
    spanGaps: true,
    ...extra,
  });

  const chartData = useMemo(()=>({
    labels,
    datasets: [
      mk("PAS","pas", COL_BLUE_MAIN),
      mk("PAD","pad", COL_BLUE_LIGHT, { borderDash:[6,3] }),
      mk("FC","fc", COL_RED, { showLine:false, borderWidth:0 }),
    ]
  }),[labels,registros]);

  const chartOptions = {
    responsive:true,
    maintainAspectRatio:false,
    devicePixelRatio: 2.5, // melhora nitidez para o PDF
    interaction:{ mode:"nearest", intersect:false },
    plugins:{
      legend:{ position:"bottom", labels:{ usePointStyle:true } },
      tooltip:{
        callbacks:{
          label: (ctx) => {
            const k = ctx.dataset.label;
            const v = ctx.parsed.y;
            if (k === "FC") return `FC: ${v} bpm`;
            return `${k}: ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mmHg`;
          }
        }
      }
    },
    scales:{
      x:{
        grid:{ color:"rgba(2,6,23,0.06)" },
        ticks:{ maxRotation:40, minRotation:40, autoSkip:true, maxTicksLimit:14 },
        title:{ display:true, text:"Hora do evento" }
      },
      yPressao:{
        position:"left",
        suggestedMin: 0, suggestedMax: 220,
        ticks:{
          stepSize:20,
          callback: (v)=> Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        },
        title:{ display:true, text:"Pressão (mmHg)" },
        grid:{ color:"rgba(2,6,23,0.08)" }
      },
      yFC:{
        position:"right",
        suggestedMin: 40, suggestedMax: 160,
        ticks:{ stepSize:20 },
        title:{ display:true, text:"FC (bpm)" },
        grid:{ drawOnChartArea:false }
      }
    }
  };

  /* ---- captura em ALTA RESOLUÇÃO para o PDF ---- */
  const captureChart = () => {
    try {
      const inst = chartRef.current;
      const chart = inst?.chart || inst; // react-chartjs-2 ou ChartJS direto

      if (chart && chart.toBase64Image) {
        const oldAnim = chart.options.animation;
        const oldRatio = chart.options.devicePixelRatio ?? window.devicePixelRatio;

        chart.options.animation = false;
        chart.options.devicePixelRatio = 3; // render 3x para exportar
        chart.resize();
        chart.update("none");

        const dataUrl = chart.toBase64Image("image/png", 1.0);
        if (dataUrl) localStorage.setItem(ficha.chartKey(), dataUrl);

        chart.options.devicePixelRatio = oldRatio;
        chart.options.animation = oldAnim;
        chart.resize();
        chart.update("none");
        return;
      }

      // fallback (caso acima falhe)
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

  useEffect(() => { const id = setTimeout(captureChart, 160); return () => clearTimeout(id); }, []);
  useEffect(() => { const id = setTimeout(captureChart, 140); return () => clearTimeout(id); }, [registros]);

  const onEnterAdd = (e) => { if (e.key === "Enter") { e.preventDefault(); add(); } };
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

          {/* Campos do gráfico principal */}
          <Stepper label="PAS (mmHg)" name="pas" value={form.pas} onChange={onChange} step={STEPS.pas} limits={LIMITS.pas}/>
          <Stepper label="PAD (mmHg)" name="pad" value={form.pad} onChange={onChange} step={STEPS.pad} limits={LIMITS.pad}/>
          <Stepper label="FC (bpm)"  name="fc"  value={form.fc}  onChange={onChange} step={STEPS.fc}  limits={LIMITS.fc}/>

          {/* Atributos (apenas para registro/coluna e PDF) */}
          <Stepper label="SpO₂ (%)"  name="spo2" value={form.spo2} onChange={onChange} step={STEPS.spo2} limits={LIMITS.spo2}/>
          <Stepper label="Temp (°C)" name="temp" value={form.temp} onChange={onChange} step={STEPS.temp} limits={LIMITS.temp} decimals={1}/>
          <Stepper label="EtCO₂ (mmHg)" name="etco2" value={form.etco2} onChange={onChange} step={STEPS.etco2} limits={LIMITS.etco2} onKeyDown={onEnterAdd}/>

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
                {["Hora","PAS","PAD","FC","SpO₂","Temp","EtCO₂","Ritmo",""].map(h=>(
                  <th key={h} className="px-3 py-2 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registros.length===0 && (
                <tr><td className="px-3 py-4 text-slate-500" colSpan={9}>Nenhum registro ainda.</td></tr>
              )}
              {registros.map((r,i)=>(
                <tr key={i} className="odd:bg-slate-50">
                  {["hora","pas","pad","fc","spo2","temp","etco2","ritmo"].map(k=>(
                    <td key={k} className="px-3 py-2">{r[k] ?? "—"}</td>
                  ))}
                  <td className="px-3 py-2">
                    <button
                      onClick={()=>del(i)}
                      className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-rose-700"
                      title="Excluir este registro"
                    >
                      Excluir
                    </button>
                  </td>
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

        {/* >>> Atributos em COLUNA (abaixo do gráfico) */}
        <div className="mt-4">
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  {["Hora","SpO₂ (%)","EtCO₂ (mmHg)","Temp (°C)"].map(h => (
                    <th key={h} className="px-3 py-2 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {registros.length === 0 && (
                  <tr><td className="px-3 py-4 text-slate-500" colSpan={4}>Sem atributos registrados.</td></tr>
                )}
                {registros.map((r, i) => (
                  <tr key={i} className="odd:bg-white even:bg-slate-50">
                    <td className="px-3 py-2">{r.hora ?? "—"}</td>
                    <td className="px-3 py-2">{r.spo2 ?? "—"}</td>
                    <td className="px-3 py-2">{r.etco2 ?? "—"}</td>
                    <td className="px-3 py-2">{r.temp ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SectionCard>
    </Page>
  );
}

function Stepper({ label, name, value, onChange, step = 1, limits = [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY], decimals = 0, onKeyDown }) {
  const [min, max] = limits;
  const parsed = parseFloat(String(value).replace(",", "."));
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
  pas:toNum(f.pas), pad:toNum(f.pad), fc:toNum(f.fc),
  spo2:toNum(f.spo2), temp:toNum(f.temp), etco2:toNum(f.etco2),
});
