const KEY = "ficha-anestesica:v1";

const initial = {
  paciente: { nome:"", idade:"", peso:"", altura:"", asa:"", urgencia:"", alergias:"" },
  cirurgia: { hospital:"", data:"", inicio:"", fim:"", procedimento:"", cirurgiao:"", anestesista:"" },
  intercorrencias: { houve:false, texto:"" },
  tecnicas: [],
  monitorizacao: {
    ECG:false, "Pressão Arterial":false, "Oximetria de Pulso":false, Capnografia:false,
    Temperatura:false, BIS:false, TOF:false, "Pressão Venosa Central":false,
  },

  vitais: { registros: [] },

  meds: {
    administradas: [], outras: [], fluidos: [],
    equipamentos: {
      tci:false, bis:false, tof:false, multiparam:false, oxigenio:false,
      modelo:"", outros:"", ventilacao:"Espontânea",
      // campos avançados (se estiver usando)
      vent_modo:"", vent_fio2:"", vent_peep:"", vent_ie:"", vent_rr:"", vent_vt_ml:"", vent_pinsp:"",
      oxi_lpm:"", tci_modo:"", tci_alvo:"", tci_taxa_ml_h:"", bis_info:"",
      tof_padrao:"", tof_musculo:"", tof_ratio:"",
    }
  },

  rpa: {
    drogas: [],
    materiais: [],
    resumo:"",
    aldrete:{ atividade:0, respiracao:0, circulacao:0, consciencia:0, saturacao:0 },
    observacoes:"",
    destino:"",
  },
};

function read() {
  try {
    const s = localStorage.getItem(KEY);
    return s ? { ...initial, ...JSON.parse(s) } : { ...initial };
  } catch {
    return { ...initial };
  }
}
function write(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export const ficha = {
  getAll() { return read(); },


  chartKey() { return `${KEY}:chart`; },

  resetAll() { write({ ...initial }); },

  setPaciente(patch) {
    const s = read(); s.paciente = { ...s.paciente, ...patch }; write(s);
  },
  setCirurgia(patch) {
    const s = read(); s.cirurgia = { ...s.cirurgia, ...patch }; write(s);
  },
  setIntercorrencias(patch) {
    const s = read(); s.intercorrencias = { ...s.intercorrencias, ...patch }; write(s);
  },
  toggleTecnica(nome) {
    const s = read();
    const has = s.tecnicas.includes(nome);
    s.tecnicas = has ? s.tecnicas.filter(t=>t!==nome) : [...s.tecnicas, nome];
    write(s);
  },
  setMonitor(nome, val) {
    const s = read(); s.monitorizacao = { ...s.monitorizacao, [nome]: !!val }; write(s);
  },

  addVital(v) {
    const s = read(); s.vitais.registros = [...s.vitais.registros, v]; write(s);
  },

  addMedAdministrada(m) {
    const s = read(); s.meds.administradas = [...s.meds.administradas, m]; write(s);
  },
  removeMedAdministrada(i) {
    const s = read(); s.meds.administradas = s.meds.administradas.filter((_,idx)=>idx!==i); write(s);
  },
  addOutraMed(m) {
    const s = read(); s.meds.outras = [...s.meds.outras, m]; write(s);
  },
  removeOutraMed(i) {
    const s = read(); s.meds.outras = s.meds.outras.filter((_,idx)=>idx!==i); write(s);
  },
  addFluido(f) {
    const s = read(); s.meds.fluidos = [...s.meds.fluidos, f]; write(s);
  },
  removeFluido(i) {
    const s = read(); s.meds.fluidos = s.meds.fluidos.filter((_,idx)=>idx!==i); write(s);
  },
  setEquip(patch) {
    const s = read(); s.meds.equipamentos = { ...s.meds.equipamentos, ...patch }; write(s);
  },

  addRpaDroga(d) {
    const s = read(); s.rpa.drogas = [...s.rpa.drogas, d]; write(s);
  },
  removeRpaDroga(i) {
    const s = read(); s.rpa.drogas = s.rpa.drogas.filter((_,idx)=>idx!==i); write(s);
  },
  addRpaMaterial(m) {
    const s = read(); s.rpa.materiais = [...s.rpa.materiais, m]; write(s);
  },
  removeRpaMaterial(i) {
    const s = read(); s.rpa.materiais = s.rpa.materiais.filter((_,idx)=>idx!==i); write(s);
  },
  setRpa(patch) {
    const s = read(); s.rpa = { ...s.rpa, ...patch }; write(s);
  },
  setAldreteField(field, idx) {
    const s = read(); s.rpa.aldrete = { ...s.rpa.aldrete, [field]: idx }; write(s);
  },
};
