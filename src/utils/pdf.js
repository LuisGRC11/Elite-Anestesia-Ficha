// src/utils/pdf.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ficha } from "../store/fichaStorage";

/** Gera o PDF da ficha — layout profissional (Unicode-ready) */
export async function gerarPDF(logo = "elite-logo.png") {
  try {
    const data = ficha.getAll();
    const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });

    // ======== Fontes (Unicode) com fallback =========
    const fontsOk = await ensureInterFonts(doc); // tenta Inter; se falhar, usa helvetica
    const F_REG = fontsOk ? "Inter" : "helvetica";
    const F_BOLD = fontsOk ? "Inter" : "helvetica";
    const WANTS_UNICODE = fontsOk;

    // helpers p/ sanitização quando não há Unicode
    const u = (s) => (WANTS_UNICODE ? String(s ?? "") : deunicode(String(s ?? "")));

    // ======== Margens / Página =========
    const M = 40;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // -------- Cabeçalho ----------
    try {
      if (logo) {
        const img = await loadImage(logo); // se 404, só ignora
        doc.addImage(img, "PNG", M, 22, 120, 36);
      }
    } catch {}
    doc.setFont(F_BOLD, "bold");
    doc.setFontSize(18);
    doc.text("Elite Anestesia", M + 130, 44);

    // faixa superior
    doc.setFillColor(2, 132, 199);
    doc.rect(0, 70, pageW, 2, "F");

    let y = 92;

    // ---------- DADOS DO PACIENTE & CIRURGIA ----------
    y = title(doc, u("Dados do Paciente & Cirurgia"), y, M, F_BOLD);
    kv(
      doc,
      [
        ["Nome", u(safe(data.paciente?.nome))],
        ["Idade", u(safe(data.paciente?.idade))],
        ["Peso (kg)", u(safe(data.paciente?.peso))],
        ["Altura (cm)", u(safe(data.paciente?.altura))],
        ["IMC", u(imcFrom(data))],
        ["ASA", u(safe(data.paciente?.asa))],
        ["Urgência (E)", u(safe(data.paciente?.urgencia))],
        ["Alergias", u(safe(data.paciente?.alergias))],
        ["Hospital/Clínica", u(safe(data.cirurgia?.hospital))],
        ["Data", u(safe(data.cirurgia?.data))],
        ["Início", u(safe(data.cirurgia?.inicio))],
        ["Fim", u(safe(data.cirurgia?.fim))],
        ["Procedimento", u(safe(data.cirurgia?.procedimento))],
        ["Cirurgião", u(safe(data.cirurgia?.cirurgiao))],
        ["Anestesiologista", u(safe(data.cirurgia?.anestesista))],
      ],
      y,
      M,
      F_REG,
      F_BOLD,
      pageW
    );
    y = safeY(doc, y) + 16;

    // ---------- INTERCORRÊNCIAS / TÉCNICAS / MONITORIZAÇÃO ----------
    y = title(doc, u("Intercorrências, Técnicas & Monitorização"), y, M, F_BOLD);
    const houveInter = !!data?.intercorrencias?.houve;
    kv(
      doc,
      [
        ["Houve intercorrências?", u(houveInter ? "Sim" : "Não")],
        ["Descrição", u(houveInter ? safe(data.intercorrencias?.texto) : "—")],
        ["Técnicas", u((data.tecnicas || []).join(", ") || "—")],
        [
          "Monitorização",
          u(
            Object.entries(data.monitorizacao || {})
              .filter(([, v]) => v)
              .map(([k]) => k)
              .join(", ") || "—"
          ),
        ],
      ],
      y,
      M,
      F_REG,
      F_BOLD,
      pageW
    );
    y = safeY(doc, y) + 16;

    // ---------- SINAIS VITAIS ----------
    y = title(doc, u("Sinais Vitais"), y, M, F_BOLD);

    // 1) Registro principal (apenas PAS/PAD/FC + ritmo)
    const headPrincipal = [u("Hora"), u("PAS"), u("PAD"), u("FC"), u("Ritmo")];
    const bodyPrincipal = (data.vitais?.registros || []).map((r) => [
      u(r.hora || "—"),
      u(val(r.pas)),
      u(val(r.pad)),
      u(val(r.fc)),
      u(r.ritmo || "—"),
    ]);
    autoTable(doc, {
      startY: y,
      head: [headPrincipal],
      body: bodyPrincipal.length ? bodyPrincipal : [[u("—")]],
      styles: baseTableStyle(F_REG),
      headStyles: headStyle(16, 185, 129),
      margin: { left: M, right: M },
      columnStyles: {
        0: { cellWidth: 60 }, // hora
        1: { cellWidth: 45 },
        2: { cellWidth: 45 },
        3: { cellWidth: 45 },
        // ritmo ocupa o resto
      },
      rowPageBreak: "avoid",
      didDrawPage: () => {},
    });
    y = safeY(doc, y) + 10;

    // 2) Atributos por etapa (em COLUNA): Hora, SpO2, EtCO2, Temp
    const tituloAttr = WANTS_UNICODE
      ? "Atributos por etapa (SpO₂ / EtCO₂ / Temp)"
      : "Atributos por etapa (SpO2 / EtCO2 / Temp)";
    autoTable(doc, {
      startY: y,
      head: [[u(tituloAttr)]],
      body: [],
      theme: "plain",
      margin: { left: M, right: M },
    });
    const headAttr = [
      u("Hora"),
      u(WANTS_UNICODE ? "SpO₂ (%)" : "SpO2 (%)"),
      u(WANTS_UNICODE ? "EtCO₂ (mmHg)" : "EtCO2 (mmHg)"),
      u("Temp (°C)"),
    ];
    const bodyAttr = (data.vitais?.registros || []).map((r) => [
      u(r.hora || "—"),
      u(val(r.spo2)),
      u(val(r.etco2)),
      u(val(r.temp)),
    ]);
    autoTable(doc, {
      startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 2 : y + 6,
      head: [headAttr],
      body: bodyAttr.length ? bodyAttr : [[u("—")]],
      styles: baseTableStyle(F_REG),
      headStyles: headStyle(59, 130, 246),
      margin: { left: M, right: M },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 90 },
        2: { cellWidth: 100 },
        3: { cellWidth: 80 },
      },
      rowPageBreak: "avoid",
      didDrawPage: () => {},
    });
    y = safeY(doc, y) + 12;

    // 3) Gráfico (alta resolução do localStorage)
    const chartUrl = getChartFromStorage();
    if (chartUrl) {
      try {
        const img = await loadImage(chartUrl);
        const w = pageW - 2 * M;
        const ratio = img && img.width ? img.height / img.width : 0.45;
        const h = Math.max(180, Math.min(pageH * 0.48, w * ratio));
        if (y + h > pageH - 60) {
          doc.addPage();
          y = 40;
        }
        doc.setFont(F_BOLD, "bold");
        doc.setFontSize(11);
        doc.text(u("Gráfico de Sinais Vitais (PAS/PAD/FC)"), M, y);
        y += 6;
        doc.addImage(chartUrl, "PNG", M, y, w, h);
        y += h + 14;
      } catch {}
    }

    // ---------- MEDICAÇÕES & EQUIPAMENTOS ----------
    y = title(doc, u("Medicações & Equipamentos"), y, M, F_BOLD);

    tableBlock(
      doc,
      u("Medicações Administradas"),
      data.meds?.administradas,
      [u("Medicação"), u("Dose"), u("Unid."), u("Via"), u("Hora")],
      (m) => [u(m.nome), u(safe(m.dose)), u(safe(m.unidade)), u(safe(m.via)), u(safe(m.horario))],
      y,
      M,
      F_REG,
      F_BOLD,
      { columnStyles: { 0: { cellWidth: 180 }, 1: { cellWidth: 70 }, 2: { cellWidth: 50 }, 3: { cellWidth: 70 } } }
    );
    y = safeY(doc, y) + 8;

    tableBlock(
      doc,
      u("Outras Medicações"),
      data.meds?.outras,
      [u("Medicação"), u("Dose"), u("Unid."), u("Via"), u("Hora")],
      (m) => [u(m.nome), u(safe(m.dose)), u(safe(m.unidade)), u(safe(m.via)), u(safe(m.horario))],
      y,
      M,
      F_REG,
      F_BOLD,
      { columnStyles: { 0: { cellWidth: 180 }, 1: { cellWidth: 70 }, 2: { cellWidth: 50 }, 3: { cellWidth: 70 } } }
    );
    y = safeY(doc, y) + 8;

    tableBlock(
      doc,
      u("Terapia de Fluidos"),
      data.meds?.fluidos,
      [u("Tipo"), u("Fluido"), u("Volume"), u("Hora")],
      (f) => [u(f.tipo), u(safe(f.fluido)), u(safe(f.volume)), u(safe(f.horario))],
      y,
      M,
      F_REG,
      F_BOLD,
      { columnStyles: { 0: { cellWidth: 140 }, 2: { cellWidth: 80 } } }
    );
    y = safeY(doc, y) + 10;

    // ----- Equipamentos -----
    const eq = data.meds?.equipamentos || {};
    const excl = new Set([
      "modelo", "outros", "ventilacao", "vent_modo", "vent_fio2", "vent_peep", "vent_ie", "vent_rr", "vent_vt_ml", "vent_pinsp",
      "oxi_lpm", "tci_modo", "tci_alvo", "tci_taxa_ml_h", "tci_conc_val", "tci_conc_unit",
      "bis_info", "tof_padrao", "tof_musculo", "tof_ratio", "tof_ptc", "tof_tetanica",
      "arcomp_litros", "n2o_litros",
      "cam_sevo", "cam_halotano", "cam_isoflurano", "cam_enflurano",
    ]);
    const marcados = Object.entries(eq)
      .filter(([k, v]) => !excl.has(k) && v)
      .map(([k]) => mapEquip(k))
      .join(", ");

    kv(
      doc,
      [
        [u("Equipamentos (marcados)"), u(marcados || "—")],
        [u("Aparelho de Anestesia"), u(safe(eq.modelo))],
        [u("Outros Equip."), u(safe(eq.outros))],
        [u("Modo de Ventilação"), u(safe(eq.ventilacao))],
      ],
      y,
      M,
      F_REG,
      F_BOLD,
      pageW
    );
    y = safeY(doc, y) + 8;

    if (eq.oxigenio) {
      kv(doc, [[u(WANTS_UNICODE ? "Fluxo O₂ (L/min)" : "Fluxo O2 (L/min)"), u(safe(eq.oxi_lpm))]], y, M, F_REG, F_BOLD, pageW);
      y = safeY(doc, y) + 6;
    }
    if (eq.arcomp) {
      kv(doc, [[u("Ar Comprimido — Quantidade (L)"), u(safe(eq.arcomp_litros))]], y, M, F_REG, F_BOLD, pageW);
      y = safeY(doc, y) + 6;
    }
    if (eq.n2o) {
      kv(doc, [[u(WANTS_UNICODE ? "Óxido Nitroso (N₂O) — Quantidade (L)" : "Oxido Nitroso (N2O) — Quantidade (L)"), u(safe(eq.n2o_litros))]], y, M, F_REG, F_BOLD, pageW);
      y = safeY(doc, y) + 6;
    }

    if (eq.ventilacao && eq.ventilacao !== "Espontânea") {
      kv(
        doc,
        [
          [u("Modo ventilatório"), u(safe(eq.vent_modo))],
          [u(WANTS_UNICODE ? "FiO₂ (%)" : "FiO2 (%)"), u(safe(eq.vent_fio2))],
          [u(WANTS_UNICODE ? "PEEP (cmH₂O)" : "PEEP (cmH2O)"), u(safe(eq.vent_peep))],
          [u("I:E"), u(safe(eq.vent_ie))],
          [u("FR (irpm)"), u(safe(eq.vent_rr))],
          [
            u(eq.vent_modo?.startsWith("VCV") || eq.vent_modo === "SIMV" ? "Vt (mL)" : (WANTS_UNICODE ? "P. Inspiração (cmH₂O)" : "P. Inspiração (cmH2O)")),
            u(eq.vent_modo?.startsWith("VCV") || eq.vent_modo === "SIMV" ? safe(eq.vent_vt_ml) : safe(eq.vent_pinsp)),
          ],
        ],
        y,
        M,
        F_REG,
        F_BOLD,
        pageW
      );
      y = safeY(doc, y) + 8;
    }

    // ---- TCI / TIVA ----
    if (eq.tci) {
      const isTCI = eq.tci_modo === "TCI - Schneider" || eq.tci_modo === "TCI - Marsh";
      const conc = eq.tci_conc_val ? `${eq.tci_conc_val} ${eq.tci_conc_unit || "ng"}` : "";
      kv(
        doc,
        [
          [u("Bomba"), u(safe(eq.tci_modo))],
          ...(isTCI ? [[u("Alvo TCI"), u(safe(eq.tci_alvo))], [u("Concentração alvo"), u(conc || "—")]] : []),
          ...(!isTCI && eq.tci_modo === "TIVA volumétrica (mL/h)" ? [[u("Taxa (mL/h)"), u(safe(eq.tci_taxa_ml_h))]] : []),
        ],
        y,
        M,
        F_REG,
        F_BOLD,
        pageW
      );
      y = safeY(doc, y) + 8;
    }

    // ---- BIS ----
    if (eq.bis) {
      kv(doc, [[u("BIS (características)"), u(safe(eq.bis_info))]], y, M, F_REG, F_BOLD, pageW);
      y = safeY(doc, y) + 6;
    }

    // ---- TOF ----
    if (eq.tof) {
      const extra = [];
      if (eq.tof_padrao === "PTC") extra.push([u("TOF — PTC (0–4)"), u(safe(eq.tof_ptc))]);
      if (eq.tof_padrao === "Tetânico") extra.push([u("TOF — Tetânica aplicada"), u(eq.tof_tetanica ? "Sim" : "Não")]);
      kv(
        doc,
        [
          [u("TOF — Padrão"), u(safe(eq.tof_padrao))],
          [u("TOF — Músculo"), u(safe(eq.tof_musculo))],
          [u("TOF — Razão (%)"), u(safe(eq.tof_ratio))],
          ...extra,
        ],
        y,
        M,
        F_REG,
        F_BOLD,
        pageW
      );
      y = safeY(doc, y) + 10;
    }

    // ---- HALOGENADOS (CAM) ----
    autoTable(doc, {
      startY: y + 4,
      head: [[u("Halogenados (CAM)")]],
      body: [],
      theme: "plain",
      margin: { left: M, right: M },
    });
    const halRows = [
      [u("Sevoflurano"), u(safe(eq.cam_sevo))],
      [u("Halotano"), u(safe(eq.cam_halotano))],
      [u("Isoflurano"), u(safe(eq.cam_isoflurano))],
      [u("Enflurano"), u(safe(eq.cam_enflurano))],
    ];
    autoTable(doc, {
      startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 2 : y + 6,
      head: [[u("Agente"), u("CAM")]],
      body: halRows,
      styles: baseTableStyle(F_REG),
      headStyles: headStyle(99, 102, 241),
      margin: { left: M, right: M },
      columnStyles: { 0: { cellWidth: 180 }, 1: { cellWidth: 80 } },
      rowPageBreak: "avoid",
    });
    y = safeY(doc, y) + 14;

    // ---------- RELATÓRIO & CUIDADOS RPA ----------
    y = title(doc, u("Relatório & Cuidados RPA"), y, M, F_BOLD);

    tableBlock(
      doc,
      u("Fichário de Gastos — Medicações"),
      data.rpa?.drogas,
      [u("Droga"), u("Concentração"), u("Quantidade")],
      (d) => [u(d.nome), u(safe(d.conc)), u(safe(d.qtd))],
      y,
      M,
      F_REG,
      F_BOLD,
      { columnStyles: { 0: { cellWidth: 180 }, 1: { cellWidth: 140 }, 2: { cellWidth: 120 } } }
    );
    y = safeY(doc, y) + 8;

    tableBlock(
      doc,
      u("Fichário de Gastos — Materiais"),
      data.rpa?.materiais,
      [u("Item"), u("Variante"), u("Qtd.")],
      (m) => [u(m.item), u(safe(m.variante)), u(safe(m.qtd))],
      y,
      M,
      F_REG,
      F_BOLD,
      { columnStyles: { 0: { cellWidth: 200 }, 1: { cellWidth: 150 }, 2: { cellWidth: 80 } } }
    );
    y = safeY(doc, y) + 8;

    const a = data.rpa?.aldrete || {};
    const tot = score(a.atividade) + score(a.respiracao) + score(a.circulacao) + score(a.consciencia) + score(a.saturacao);
    kv(
      doc,
      [
        [u("Resumo"), u(safe(data.rpa?.resumo))],
        [u("Aldrete (0–10)"), String(tot)],
        [u("Observações RPA"), u(safe(data.rpa?.observacoes))],
        [u("Destino do paciente"), u(safe(data.rpa?.destino))],
      ],
      y,
      M,
      F_REG,
      F_BOLD,
      pageW
    );
    y = safeY(doc, y) + 8;

    // Rodapé em todas as páginas
    finalizeFooter(doc, F_REG);

    doc.save("ficha-anestesica.pdf");
  } catch (err) {
    console.error("[PDF] Erro ao gerar:", err);
    alert("Erro ao gerar PDF. Veja o Console (F12).");
  }
}

/* ================= helpers ================= */
const title = (doc, t, y, M, FONT_BOLD) => {
  doc.setFont(FONT_BOLD, "bold");
  doc.setFontSize(13);
  doc.text(t, M, y);
  return y + 8;
};

function kv(doc, pairs, y, M, FONT_REG, FONT_BOLD, pageW) {
  autoTable(doc, {
    startY: y + 4,
    head: [["Campo", "Valor"]],
    body: pairs.map(([k, v]) => [k, String(v)]),
    styles: baseTableStyle(FONT_REG),
    headStyles: headStyle(2, 132, 199),
    columnStyles: {
      0: { cellWidth: 190, font: FONT_BOLD, fontStyle: "bold" },
      1: { cellWidth: pageW - 2 * M - 190 },
    },
    margin: { left: M, right: M },
    rowPageBreak: "avoid",
  });
}

function tableBlock(doc, titleText, arr, head, mapRow, y, M, FONT_REG, FONT_BOLD, extra = {}) {
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
    styles: baseTableStyle(FONT_REG),
    headStyles: headStyle(59, 130, 246),
    margin: { left: M, right: M },
    rowPageBreak: "avoid",
    ...extra,
  });
}

const baseTableStyle = (font) => ({
  font,
  fontSize: 9,
  cellPadding: 4,
  lineColor: [226, 232, 240],
  lineWidth: 0.4,
  halign: "left",
  overflow: "linebreak",
  minCellHeight: 14,
  textColor: [17, 24, 39],
  wordBreak: "normal",
});
const headStyle = (r, g, b) => ({
  fillColor: [r, g, b],
  textColor: 255,
  halign: "left",
});

function finalizeFooter(doc, FONT_REG) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont(FONT_REG, "normal");
    doc.setFontSize(9);
    doc.setTextColor(120);
    const text = `Gerado por Elite Anestesia • ${new Date().toLocaleString("pt-BR")} — pág. ${i}/${pages}`;
    doc.text(text, 40, doc.internal.pageSize.getHeight() - 18);
  }
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
    arcomp: "Ar Comprimido",
    n2o: "Óxido Nitroso (N₂O)",
  }[k] || k);

const safe = (v) => (v == null || v === "" ? "—" : v);
const val = (v) => (v == null || v === "" ? "—" : String(v));

function safeY(doc, fallback) {
  return doc.lastAutoTable?.finalY ?? fallback;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (typeof url === "string" && !url.startsWith("data:")) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function getChartFromStorage() {
  try {
    const dynamicKey = typeof ficha.chartKey === "function" ? ficha.chartKey() : null;
    const tryKeys = [dynamicKey, "ficha-anestesica:v1:chart"].filter(Boolean);
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
  } catch {}
  return null;
}

/* ======= Fontes Unicode (Inter) com fallback ======= */
async function ensureInterFonts(doc) {
  try {
    const reg = await fetchAsBase64("/fonts/Inter-Regular.ttf");
    const bold = await fetchAsBase64("/fonts/Inter-Bold.ttf");
    if (!reg || !bold) return false;
    doc.addFileToVFS("Inter-Regular.ttf", reg);
    doc.addFileToVFS("Inter-Bold.ttf", bold);
    doc.addFont("Inter-Regular.ttf", "Inter", "normal");
    doc.addFont("Inter-Bold.ttf", "Inter", "bold");
    doc.setFont("Inter", "normal");
    return true;
  } catch {
    // fallback silencioso (helvetica)
    doc.setFont("helvetica", "normal");
    return false;
  }
}
async function fetchAsBase64(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  const blob = await res.blob();
  return await blobToBase64(blob);
}
function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(",")[1] || null);
    reader.readAsDataURL(blob);
  });
}

/* ======= Sanitização p/ fallback sem Unicode ======= */
function deunicode(s) {
  if (!s) return s;
  return s
    .replaceAll("—", "-")
    .replaceAll("–", "-")
    .replaceAll("•", "·")
    .replaceAll("º", "o")
    .replaceAll("ª", "a")
    .replaceAll("₀", "0").replaceAll("₁", "1").replaceAll("₂", "2").replaceAll("₃", "3")
    .replaceAll("₄", "4").replaceAll("₅", "5").replaceAll("₆", "6").replaceAll("₇", "7")
    .replaceAll("₈", "8").replaceAll("₉", "9")
    .replaceAll("₍", "(").replaceAll("₎", ")")
    .replaceAll("₊", "+").replaceAll("₋", "-")
    .replaceAll("\u00A0", " "); // NBSP -> espaço normal
}
