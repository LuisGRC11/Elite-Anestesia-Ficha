import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ficha } from "../store/fichaStorage";


export async function gerarPDF(logo = "/elite-logo.png") {
  try {
    const data = ficha.getAll();
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const M = 40;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    try {
      if (logo) {
        const img = await loadImage(logo);
        doc.addImage(img, "PNG", M, 22, 120, 36);
      }
    } catch {}
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Elite Anestesia", M + 130, 45);
    doc.setFillColor(8, 145, 178);
    doc.rect(0, 70, pageW, 2, "F");

    let y = 90;

    y = title(doc, "Dados do Paciente & Cirurgia", y, M);
    kv(
      doc,
      [
        ["Nome", safe(data.paciente?.nome)],
        ["Idade", safe(data.paciente?.idade)],
        ["Peso (kg)", safe(data.paciente?.peso)],
        ["Altura (cm)", safe(data.paciente?.altura)],
        ["IMC", imcFrom(data)],
        ["ASA", safe(data.paciente?.asa)],
        ["Urgência (E)", safe(data.paciente?.urgencia)],
        ["Alergias", safe(data.paciente?.alergias)],
        ["Hospital/Clínica", safe(data.cirurgia?.hospital)],
        ["Data", safe(data.cirurgia?.data)],
        ["Início", safe(data.cirurgia?.inicio)],
        ["Fim", safe(data.cirurgia?.fim)],
        ["Procedimento", safe(data.cirurgia?.procedimento)],
        ["Cirurgião", safe(data.cirurgia?.cirurgiao)],
        ["Anestesiologista", safe(data.cirurgia?.anestesista)],
      ],
      y,
      M
    );
    y = safeY(doc, y) + 16;

    y = title(doc, "Intercorrências, Técnicas & Monitorização", y, M);
    const houveInter = !!data?.intercorrencias?.houve;
    kv(
      doc,
      [
        ["Houve intercorrências?", houveInter ? "Sim" : "Não"],
        ["Descrição", houveInter ? safe(data.intercorrencias?.texto) : "—"],
        ["Técnicas", (data.tecnicas || []).join(", ") || "—"],
        [
          "Monitorização",
          Object.entries(data.monitorizacao || {})
            .filter(([, v]) => v)
            .map(([k]) => k)
            .join(", ") || "—",
        ],
      ],
      y,
      M
    );
    y = safeY(doc, y) + 16;

    y = title(doc, "Sinais Vitais", y, M);
    const cols = [
      "Hora",
      "PAS",
      "PAD",
      "FC",
      "SpO₂",
      "Temp",
      "EtCO₂",
      "FR",
      "PNI",
      "Oxim",
      "Capno",
      "Sat",
      "Ritmo",
    ];
    const rows = (data.vitais?.registros || []).map((r) => [
      r.hora || "—",
      val(r.pas),
      val(r.pad),
      val(r.fc),
      val(r.spo2),
      val(r.temp),
      val(r.etco2),
      val(r.fr),
      val(r.pni),
      val(r.oximetria),
      val(r.capno),
      val(r.saturacao),
      r.ritmo || "—",
    ]);
    autoTable(doc, {
      startY: y,
      head: [cols],
      body: rows.length ? rows : [["—"]],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [16, 185, 129] },
      margin: { left: M, right: M },
    });
    y = safeY(doc, y) + 12;

    const chartUrl = getChartFromStorage();
    if (chartUrl) {
      try {
        const img = await loadImage(chartUrl);
        const w = pageW - 2 * M;
        const ratio = img && img.width ? img.height / img.width : 0.45;
        const h = Math.max(160, Math.min(pageH * 0.45, w * ratio));
        if (y + h > pageH - 40) {
          doc.addPage();
          y = 40;
        }
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Gráfico de Sinais Vitais", M, y);
        y += 6;
        doc.addImage(chartUrl, "PNG", M, y, w, h);
        y += h + 16;
      } catch (e) {
        console.warn("Falha ao carregar imagem do gráfico:", e);
      }
    }

    y = title(doc, "Medicações & Equipamentos", y, M);

    tableBlock(
      doc,
      "Medicações Administradas",
      data.meds?.administradas,
      ["Medicação", "Dose", "Unid.", "Via", "Hora"],
      (m) => [m.nome, safe(m.dose), safe(m.unidade), safe(m.via), safe(m.horario)],
      y,
      M
    );
    y = safeY(doc, y) + 8;

    tableBlock(
      doc,
      "Outras Medicações",
      data.meds?.outras,
      ["Medicação", "Dose", "Unid.", "Via", "Hora"],
      (m) => [m.nome, safe(m.dose), safe(m.unidade), safe(m.via), safe(m.horario)],
      y,
      M
    );
    y = safeY(doc, y) + 8;

    tableBlock(
      doc,
      "Terapia de Fluidos",
      data.meds?.fluidos,
      ["Tipo", "Fluido", "Volume", "Hora"],
      (f) => [f.tipo, safe(f.fluido), safe(f.volume), safe(f.horario)],
      y,
      M
    );
    y = safeY(doc, y) + 8;

    const eq = data.meds?.equipamentos || {};
    const excl = new Set([
      "modelo",
      "outros",
      "ventilacao",
      "vent_modo",
      "vent_fio2",
      "vent_peep",
      "vent_ie",
      "vent_rr",
      "vent_vt_ml",
      "vent_pinsp",
      "oxi_lpm",
      "tci_modo",
      "tci_alvo",
      "tci_taxa_ml_h",
      "bis_info",
      "tof_padrao",
      "tof_musculo",
      "tof_ratio",
    ]);
    const marcados = Object.entries(eq)
      .filter(([k, v]) => !excl.has(k) && v)
      .map(([k]) => mapEquip(k))
      .join(", ");

    kv(
      doc,
      [
        ["Equipamentos (marcados)", marcados || "—"],
        ["Aparelho de Anestesia", safe(eq.modelo)],
        ["Outros Equip.", safe(eq.outros)],
        ["Modo de Ventilação", safe(eq.ventilacao)],
      ],
      y,
      M
    );
    y = safeY(doc, y) + 6;

    if (eq.oxigenio) {
      kv(doc, [["Fluxo O₂ (L/min)", safe(eq.oxi_lpm)]], y, M);
      y = safeY(doc, y) + 6;
    }

    if (eq.ventilacao && eq.ventilacao !== "Espontânea") {
      kv(
        doc,
        [
          ["Modo ventilatório", safe(eq.vent_modo)],
          ["FiO₂ (%)", safe(eq.vent_fio2)],
          ["PEEP (cmH₂O)", safe(eq.vent_peep)],
          ["I:E", safe(eq.vent_ie)],
          ["FR (irpm)", safe(eq.vent_rr)],
          [
            eq.vent_modo?.startsWith("VCV") || eq.vent_modo === "SIMV"
              ? "Vt (mL)"
              : "P. Inspiração (cmH₂O)",
            eq.vent_modo?.startsWith("VCV") || eq.vent_modo === "SIMV"
              ? safe(eq.vent_vt_ml)
              : safe(eq.vent_pinsp),
          ],
        ],
        y,
        M
      );
      y = safeY(doc, y) + 6;
    }

    if (eq.tci) {
      const isTCI =
        eq.tci_modo === "TCI - Schneider" || eq.tci_modo === "TCI - Marsh";
      kv(
        doc,
        [
          ["Bomba", safe(eq.tci_modo)],
          ...(isTCI ? [["Alvo TCI", safe(eq.tci_alvo)]] : []),
          ...(!isTCI && eq.tci_modo === "TIVA volumétrica (mL/h)"
            ? [["Taxa (mL/h)", safe(eq.tci_taxa_ml_h)]]
            : []),
        ],
        y,
        M
      );
      y = safeY(doc, y) + 6;
    }

    if (eq.bis) {
      kv(doc, [["BIS (características)", safe(eq.bis_info)]], y, M);
      y = safeY(doc, y) + 6;
    }

    if (eq.tof) {
      kv(
        doc,
        [
          ["TOF — Padrão", safe(eq.tof_padrao)],
          ["TOF — Músculo", safe(eq.tof_musculo)],
          ["TOF — Razão (%)", safe(eq.tof_ratio)],
        ],
        y,
        M
      );
      y = safeY(doc, y) + 10;
    }

    y = title(doc, "Relatório & Cuidados RPA", y, M);

    tableBlock(
      doc,
      "Fichário de Gastos — Medicações",
      data.rpa?.drogas,
      ["Droga", "Concentração", "Quantidade"],
      (d) => [d.nome, safe(d.conc), safe(d.qtd)],
      y,
      M
    );
    y = safeY(doc, y) + 8;

    tableBlock(
      doc,
      "Fichário de Gastos — Materiais",
      data.rpa?.materiais,
      ["Item", "Variante", "Qtd."],
      (m) => [m.item, safe(m.variante), safe(m.qtd)],
      y,
      M
    );
    y = safeY(doc, y) + 8;

    const a = data.rpa?.aldrete || {};
    const tot =
      score(a.atividade) +
      score(a.respiracao) +
      score(a.circulacao) +
      score(a.consciencia) +
      score(a.saturacao);

    kv(
      doc,
      [
        ["Resumo", safe(data.rpa?.resumo)],
        ["Aldrete (0–10)", String(tot)],
        ["Observações RPA", safe(data.rpa?.observacoes)],
        ["Destino do paciente", safe(data.rpa?.destino)],
      ],
      y,
      M
    );
    y = safeY(doc, y) + 8;

    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(
        `Gerado por Elite Anestesia • ${new Date().toLocaleString()} — pág. ${i}/${pages}`,
        M,
        doc.internal.pageSize.getHeight() - 18
      );
    }

    doc.save("ficha-anestesica.pdf");
  } catch (err) {
    console.error("[PDF] Erro ao gerar:", err);
    alert("Erro ao gerar PDF. Veja o Console (F12).");
  }
}

const title = (doc, t, y, M) => (
  doc.setFontSize(13), doc.setFont("helvetica", "bold"), doc.text(t, M, y), y + 8
);

function kv(doc, pairs, y, M) {
  autoTable(doc, {
    startY: y + 4,
    head: [["Campo", "Valor"]],
    body: pairs.map(([k, v]) => [k, String(v)]),
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [2, 132, 199] },
    columnStyles: { 0: { cellWidth: 170 } },
    margin: { left: M, right: M },
  });
}

function tableBlock(doc, titleText, arr, head, mapRow, y, M) {
  const body = (arr || []).map(mapRow);
  autoTable(doc, {
    startY: y + 4,
    head: [[titleText]],
    body: [],
    theme: "plain",
    margin: { left: M, right: M },
  });
  autoTable(doc, {
    startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 2 : y + 6,
    head: [head],
    body: body.length ? body : [["—"]],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: M, right: M },
  });
}

const score = (idx = 0) => [0, 1, 2][idx] ?? 0;

const imcFrom = (data) => {
  const p = parseFloat(data?.paciente?.peso || "");
  const a = parseFloat(data?.paciente?.altura || "") / 100;
  if (!p || !a) return "—";
  const v = p / (a * a);
  return Number.isFinite(v) ? v.toFixed(1) : "—";
};

const mapEquip = (k) =>
  ({
    tci: "Bomba TCI/TIVA",
    bis: "Monitor BIS",
    tof: "Monitor TOF",
    multiparam: "Monitor Multiparamétrico",
    oxigenio: "OXIGÊNIO",
  }[k] || k);

const safe = (v) => (v == null || v === "" ? "—" : v);
const val = (v) => (v == null || v === "" ? "—" : String(v));

function safeY(doc, fallback) {
  return doc.lastAutoTable?.finalY ?? fallback;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (typeof url === "string" && !url.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function getChartFromStorage() {
  try {
    const dynamicKey =
      typeof ficha.chartKey === "function" ? ficha.chartKey() : null;

    const tryKeys = [
      dynamicKey,
      "ficha-anestesica:v1:chart",
    ].filter(Boolean);

    for (const k of tryKeys) {
      const v = localStorage.getItem(k);
      if (v && v.startsWith("data:image")) return v;
    }

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && /chart/i.test(k)) {
        const v = localStorage.getItem(k);
        if (v && v.startsWith("data:image")) return v;
      }
    }
  } catch (e) {
    console.warn("Falha ao obter gráfico do localStorage:", e);
  }
  return null;
}
