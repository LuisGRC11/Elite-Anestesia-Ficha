import { createContext, useContext, useEffect, useMemo, useState } from "react";

const LS_KEY = "ficha-anestesica:v1";

const initialState = {
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
    equipamentos: { tci:false, bis:false, tof:false, multiparam:false, oxigenio:false, modelo:"", outros:"", ventilacao:"Espontânea" },
  },
  rpa: { drogas: [], resumo:"", aldrete:{ atividade:0, respiracao:0, circulacao:0, consciencia:0, saturacao:0 }, observacoes:"" },
};

const Ctx = createContext(null);
const load = () => { try { const x = localStorage.getItem(LS_KEY); return x ? { ...initialState, ...JSON.parse(x) } : initialState; } catch { return initialState; } };

export function FichaProvider({ children }) {
  const [state, setState] = useState(load);

  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(state)); }, [state]);

  const imc = useMemo(() => {
    const p = parseFloat(String(state.paciente.peso||"").replace(",","."));
    const a = parseFloat(String(state.paciente.altura||"").replace(",", "."))/100;
    if (!p || !a) return "";
    const v = p/(a*a);
    return Number.isFinite(v) ? v.toFixed(1) : "";
  }, [state.paciente.peso, state.paciente.altura]);

  const setPaciente = (patch) => setState(s => ({ ...s, paciente:{ ...s.paciente, ...patch }}));
  const setCirurgia = (patch) => setState(s => ({ ...s, cirurgia:{ ...s.cirurgia, ...patch }}));
  const setIntercorrencias = (patch) => setState(s => ({ ...s, intercorrencias:{ ...s.intercorrencias, ...patch }}));
  const setTecnicas = (arr) => setState(s => ({ ...s, tecnicas: Array.isArray(arr)?arr:s.tecnicas }));
  const setMonitorizacao = (patch) => setState(s => ({ ...s, monitorizacao:{ ...s.monitorizacao, ...patch }}));

  const addVital = (v) => setState(s => ({ ...s, vitais:{ ...s.vitais, registros:[...s.vitais.registros, v] }}));
  const removeVital = (i) => setState(s => ({ ...s, vitais:{ ...s.vitais, registros:s.vitais.registros.filter((_,idx)=>idx!==i) }}));

  const addMedAdministrada = (m) => setState(s => ({ ...s, meds:{ ...s.meds, administradas:[...s.meds.administradas, m] }}));
  const removeMedAdministrada = (i) => setState(s => ({ ...s, meds:{ ...s.meds, administradas:s.meds.administradas.filter((_,idx)=>idx!==i) }}));

  const addOutraMed = (m) => setState(s => ({ ...s, meds:{ ...s.meds, outras:[...s.meds.outras, m] }}));
  const removeOutraMed = (i) => setState(s => ({ ...s, meds:{ ...s.meds, outras:s.meds.outras.filter((_,idx)=>idx!==i) }}));

  const addFluido = (f) => setState(s => ({ ...s, meds:{ ...s.meds, fluidos:[...s.meds.fluidos, f] }}));
  const removeFluido = (i) => setState(s => ({ ...s, meds:{ ...s.meds, fluidos:s.meds.fluidos.filter((_,idx)=>idx!==i) }}));

  const setEquipamentos = (patch) => setState(s => ({ ...s, meds:{ ...s.meds, equipamentos:{ ...s.meds.equipamentos, ...patch }}}));

  const addRpaDroga = (d) => setState(s => ({ ...s, rpa:{ ...s.rpa, drogas:[...s.rpa.drogas, d] }}));
  const removeRpaDroga = (i) => setState(s => ({ ...s, rpa:{ ...s.rpa, drogas:s.rpa.drogas.filter((_,idx)=>idx!==i) }}));
  const setRpa = (patch) => setState(s => ({ ...s, rpa:{ ...s.rpa, ...patch }}));

  const resetPaciente = () => setState(s => ({ ...s, paciente: initialState.paciente }));
  const resetCirurgia = () => setState(s => ({ ...s, cirurgia: initialState.cirurgia }));
  const resetIntercorrencias = () => setState(s => ({ ...s, intercorrencias: initialState.intercorrencias, tecnicas: [] }));
  const resetMonitorizacao = () => setState(s => ({ ...s, monitorizacao: initialState.monitorizacao }));
  const resetVitais = () => setState(s => ({ ...s, vitais: initialState.vitais }));
  const resetMeds = () => setState(s => ({ ...s, meds: initialState.meds }));
  const resetRpa = () => setState(s => ({ ...s, rpa: initialState.rpa }));
  const resetAll = () => { localStorage.removeItem(LS_KEY); setState(initialState); };

  const value = {
    state, imc,
    setPaciente, setCirurgia, setIntercorrencias, setTecnicas, setMonitorizacao,
    addVital, removeVital,
    addMedAdministrada, removeMedAdministrada,
    addOutraMed, removeOutraMed,
    addFluido, removeFluido, setEquipamentos,
    addRpaDroga, removeRpaDroga, setRpa,
    resetPaciente, resetCirurgia, resetIntercorrencias, resetMonitorizacao, resetVitais, resetMeds, resetRpa, resetAll,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useFicha = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFicha deve ser usado dentro de <FichaProvider>");
  return ctx;
};
