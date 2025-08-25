const PREFIX = "ficha-anestesica:v1:";
const SID_KEY = PREFIX + "sid";

function getSID() {
  let sid = sessionStorage.getItem(SID_KEY);
  if (!sid) {
    sid =
      (globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`) + "";
    sessionStorage.setItem(SID_KEY, sid);
  }
  return sid;
}
function sessionKey() {
  return PREFIX + getSID();
}
function chartKey() {
  return sessionKey() + ":chart";
}

const initial = {
  paciente: {
    nome: "",
    idade: "",
    peso: "",
    altura: "",
    asa: "",
    urgencia: "",
    alergias: "",
  },
  cirurgia: {
    hospital: "",
    data: "",
    inicio: "",
    fim: "",
    procedimento: "",
    cirurgiao: "",
    anestesista: "",
  },
  intercorrencias: { houve: false, texto: "" },
  tecnicas: [],
  monitorizacao: {
    ECG: false,
    "Pressão Arterial": false,
    "Oximetria de Pulso": false,
    Capnografia: false,
    Temperatura: false,
    BIS: false,
    TOF: false,
    "Pressão Venosa Central": false,
  },

  vitais: { registros: [] },

  meds: {
    administradas: [],
    outras: [],
    fluidos: [],
    equipamentos: {
      tci: false,
      bis: false,
      tof: false,
      multiparam: false,
      oxigenio: false,
      modelo: "",
      outros: "",
      ventilacao: "Espontânea",
    },
  },

  rpa: {
    drogas: [],
    resumo: "",
    aldrete: {
      atividade: 0,
      respiracao: 0,
      circulacao: 0,
      consciencia: 0,
      saturacao: 0,
    },
    observacoes: "",
  },
};

const LEGACY_KEY = "ficha-anestesica:v1"; 

function read() {
  try {
    const k = sessionKey();
    if (localStorage.getItem(LEGACY_KEY) && !localStorage.getItem(k)) {
      localStorage.setItem(k, localStorage.getItem(LEGACY_KEY));
      localStorage.removeItem(LEGACY_KEY);
    }
    const raw = localStorage.getItem(k);
    return raw ? { ...initial, ...JSON.parse(raw) } : { ...initial };
  } catch {
    return { ...initial };
  }
}
function write(data) {
  localStorage.setItem(sessionKey(), JSON.stringify(data));
}

export const ficha = {

  getAll() {
    return read();
  },


  resetAll() {
    write({ ...initial });
    localStorage.removeItem(chartKey());
  },

  resetAllSessions() {
    const prefix = PREFIX;
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith(prefix)) localStorage.removeItem(k);
    });
    sessionStorage.removeItem(SID_KEY);
  },

  getSessionId() {
    return getSID();
  },
  chartKey,

  setPaciente(patch) {
    const s = read();
    s.paciente = { ...s.paciente, ...patch };
    write(s);
  },


  setCirurgia(patch) {
    const s = read();
    s.cirurgia = { ...s.cirurgia, ...patch };
    write(s);
  },

  setIntercorrencias(patch) {
    const s = read();
    s.intercorrencias = { ...s.intercorrencias, ...patch };
    write(s);
  },


  toggleTecnica(nome) {
    const s = read();
    const has = s.tecnicas.includes(nome);
    s.tecnicas = has ? s.tecnicas.filter((t) => t !== nome) : [...s.tecnicas, nome];
    write(s);
  },

  setMonitor(nome, val) {
    const s = read();
    s.monitorizacao = { ...s.monitorizacao, [nome]: !!val };
    write(s);
  },

  addVital(v) {
    const s = read();
    s.vitais.registros = [...s.vitais.registros, v];
    write(s);
  },

  addMedAdministrada(m) {
    const s = read();
    s.meds.administradas = [...s.meds.administradas, m];
    write(s);
  },
  removeMedAdministrada(i) {
    const s = read();
    s.meds.administradas = s.meds.administradas.filter((_, idx) => idx !== i);
    write(s);
  },
  addOutraMed(m) {
    const s = read();
    s.meds.outras = [...s.meds.outras, m];
    write(s);
  },
  removeOutraMed(i) {
    const s = read();
    s.meds.outras = s.meds.outras.filter((_, idx) => idx !== i);
    write(s);
  },
  addFluido(f) {
    const s = read();
    s.meds.fluidos = [...s.meds.fluidos, f];
    write(s);
  },
  removeFluido(i) {
    const s = read();
    s.meds.fluidos = s.meds.fluidos.filter((_, idx) => idx !== i);
    write(s);
  },
  setEquip(patch) {
    const s = read();
    s.meds.equipamentos = { ...s.meds.equipamentos, ...patch };
    write(s);
  },

  addRpaDroga(d) {
    const s = read();
    s.rpa.drogas = [...s.rpa.drogas, d];
    write(s);
  },
  removeRpaDroga(i) {
    const s = read();
    s.rpa.drogas = s.rpa.drogas.filter((_, idx) => idx !== i);
    write(s);
  },
  setRpa(patch) {
    const s = read();
    s.rpa = { ...s.rpa, ...patch };
    write(s);
  },
  setAldreteField(field, idx) {
    const s = read();
    s.rpa.aldrete = { ...s.rpa.aldrete, [field]: idx };
    write(s);
  },
};
