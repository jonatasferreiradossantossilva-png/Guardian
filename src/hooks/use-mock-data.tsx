'use client';
import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { initialMockData } from '@/lib/mock-data';
import { SIMULATION_ROUTE_TRACK, getRoutePointAt } from '@/lib/simulation-engine';
import { MockDB, Student, SchoolData, Route, Driver, User, LocationUpdate } from '@/types/mock-data';

export interface MockDataContextType {
  db: MockDB;
  getCollection: (collectionName: keyof MockDB, filters?: any[]) => any[];
  getDoc: (collectionName: keyof MockDB, docId: string) => any;
  addDoc: (collectionName: keyof MockDB, data: any) => string;
  addDocsBatch: (collectionName: keyof MockDB, dataArray: any[]) => void;
  updateDoc: (collectionName: keyof MockDB, docId: string, data: any) => void;
  clearCollection: (collectionName: keyof MockDB) => void;
  deleteDoc: (collectionName: keyof MockDB, docId: string) => void;
  getNestedDoc: (path: string) => any;
  setDoc: (path: string, data: any) => void;
  setIsSimulating: React.Dispatch<React.SetStateAction<boolean>>;
  isSimulating: boolean;
  resetData: () => void;
  forceScenario: (scenario: 'motorista_inicio' | 'monitor_em_rota') => void;
  clearAllAndReset: () => void;
  createNotification: (userId: string, title: string, message: string, type?: 'info' | 'warning' | 'emergency' | 'success') => void;
}

export const MockDataContext = createContext<MockDataContextType | null>(null);

// --- UTILITÁRIOS DE QUALIDADE ---
const generateId = (prefix: string) => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `${prefix}-${crypto.randomUUID().split('-')[0]}-${Date.now().toString(36)}`;
    }
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}-${Date.now().toString(36)}`;
};

const LOCAL_STORAGE_KEY = 'guardian_mock_db';

/**
 * Provedor de Dados Mockado (Simulador de Firebase)
 * Estrutura unificada e robusta para evitar erros de inicialização (TDZ).
 */
export function MockDataProvider({ children }: { children: React.ReactNode }) {
  // --- SUPORTE SÍNCRONO PARA E2E / TESTES ---
  // Capturamos o usuário da URL imediatamente para evitar falhas de hidratação/redirect
  if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlUserId = params.get('mockUserId') || params.get('mockUser');
      const urlRouteId = params.get('mockRouteId');
      if (urlUserId) {
          sessionStorage.setItem('mockUserId', urlUserId);
          if (urlRouteId) {
              sessionStorage.setItem('activeRouteId', urlRouteId);
          }
          if (params.get('isTesting')) {
              localStorage.setItem('hide-ios-prompt', 'true');
              (window as any).IS_TESTING = true;
          }
      }
  }

  // Estados primeiro
  const [db, setDb] = useState(() => initialMockData);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  
  // Persistência com Debounce para evitar bloqueio da Main Thread
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- DEFINIÇÃO DE FUNÇÕES ---
  
  function getCollection(collectionName: keyof MockDB, filters?: any[]) {
    if (!collectionName || !db[collectionName]) return [];
    let results;
    if (collectionName === 'locations') {
        results = Object.entries(db.locations).map(([id, data]) => ({ ...data, id }));
    } else {
        results = db[collectionName];
    }
    if (!Array.isArray(results)) return [];
    
    if (filters && Array.isArray(filters) && filters.length > 0) {
      results = results.filter(doc => {
        return filters.every(filter => {
          const { field, op, value } = filter;
          if (value === null || value === undefined || value === "") return false;
          if (op === '==') return doc[field] === value;
          if (op === 'in') return Array.isArray(value) && value.includes(doc[field]);
          return true;
        });
      });
    }
    return results;
  }

  function getDoc(collectionName: keyof MockDB, docId: string) {
    if (!collectionName || !docId) return null;
    const collection = db[collectionName];
    if (!Array.isArray(collection)) return null;
    return collection.find(doc => doc.id === docId) || null;
  }

  function getNestedDoc(path: string) {
    const [collectionName, docId] = path.split('/');
    if (collectionName === 'locations' && docId) return db.locations[docId] || null;
    return null;
  }

  function addDoc(collectionName: keyof MockDB, data: any) {
    const newId = data.id || generateId(collectionName.slice(0, 3));
    const newDoc = { ...data, id: newId };
    
    setDb(prevDb => {
      const collection = prevDb[collectionName];
      if (Array.isArray(collection)) {
        let nextDb = {
          ...prevDb,
          [collectionName]: [...collection, newDoc],
        };

        // GATILHO AUTOMÁTICO DE NOTIFICAÇÃO PARA MENSAGENS
        if (collectionName === 'messages' && data.recipientId) {
            const senderName = prevDb.users?.find(u => u.id === data.senderId)?.name || "Alguém";
            const notification = {
                id: `notif-msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                userId: data.recipientId,
                title: "Nova Mensagem",
                message: `Você recebeu uma mensagem de ${senderName}: "${data.text.substring(0, 30)}${data.text.length > 30 ? '...' : ''}"`,
                type: 'info' as const,
                read: false,
                createdAt: new Date().toISOString()
            };
            nextDb.notifications = [notification, ...(nextDb.notifications || [])];
        }

        // GATILHO AUTOMÁTICO DE NOTIFICAÇÃO PARA INCIDENTES (ALERTA GERAL DE SEGURANÇA)
        if (collectionName === 'incidents') {
            const reporterName = prevDb.users?.find(u => u.id === data.reporter)?.name || "Alguém";
            // Notificar todos os motoristas e admins no sistema
            prevDb.users?.filter(u => u.profile === 'motorista' || u.profile === 'gestor').forEach(u => {
                const incidentNotification = {
                    id: `notif-inc-${Date.now()}-${u.id}-${Math.random().toString(36).substr(2, 5)}`,
                    userId: u.id,
                    title: "ALERTA DE SEGURANÇA",
                    message: `🚨 ${reporterName} relatou incidente: ${data.description.substring(0, 50)}...`,
                    type: 'warning' as const,
                    read: false,
                    createdAt: new Date().toISOString()
                };
                nextDb.notifications = [incidentNotification, ...(nextDb.notifications || [])];
            });
        }

        return nextDb;
      }
      return prevDb;
    });
    return newId;
  }

  function addDocsBatch(collectionName: keyof MockDB, dataArray: any[]) {
    if (!dataArray.length) return;
    
    setDb(prevDb => {
      const collection = prevDb[collectionName];
      if (Array.isArray(collection)) {
        // Garantir unicidade absoluta no lote
        const newDocs = dataArray.map(data => ({
          ...data,
          id: data.id || generateId(collectionName.slice(0, 3))
        }));
        
        return {
          ...prevDb,
          [collectionName]: [...collection, ...newDocs],
        };
      }
      return prevDb;
    });
  }

  function updateDoc(collectionName: keyof MockDB, docId: string, data: any) {
    if (collectionName === 'locations') {
        setDb(prevDb => ({
            ...prevDb,
            locations: { ...prevDb.locations, [docId]: { ...(prevDb.locations[docId] || {}), ...data } }
        }));
    } else if (Array.isArray(db[collectionName])) {
        setDb(prevDb => {
            const collection = prevDb[collectionName];
            if (Array.isArray(collection)) {
                return {
                    ...prevDb,
                    [collectionName]: collection.map((doc: any) => doc.id === docId ? { ...doc, ...data } : doc),
                };
            }
            return prevDb;
        });
    }
  }

  function setDoc(path: string, data: any) {
    const [collectionName, docId] = path.split('/');
    if (collectionName === 'locations' && docId) {
      setDb(prevDb => ({
          ...prevDb,
          locations: { ...prevDb.locations, [docId]: { ...(prevDb.locations[docId] || {}), ...data } }
      }));
    }
  }

  function deleteDoc(collectionName: keyof MockDB, docId: string) {
    if (Array.isArray(db[collectionName])) {
      setDb(prevDb => {
        const collection = prevDb[collectionName];
        if (Array.isArray(collection)) {
            return {
                ...prevDb,
                [collectionName]: collection.filter((doc: any) => doc.id !== docId),
            };
        }
        return prevDb;
      });
    }
  }

  function clearCollection(collectionName: keyof MockDB) {
    setDb(prev => ({
        ...prev,
        [collectionName]: []
    }));
  }

  function resetData() {
    setDb(initialMockData);
    if (typeof window !== 'undefined') {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        localStorage.removeItem(LOCAL_STORAGE_KEY + '_version');
    }
  }

  // --- MEMOIZE DAS FUNÇÕES ---
  const memoGetCollection = useCallback(getCollection, [db]);
  const memoGetDoc = useCallback(getDoc, [db]);
  const memoGetNestedDoc = useCallback(getNestedDoc, [db]);
  const memoAddDoc = useCallback(addDoc, []);
  const memoAddDocsBatch = useCallback(addDocsBatch, []);
  const memoUpdateDoc = useCallback(updateDoc, []);
  const memoClearCollection = useCallback(clearCollection, []);
  const memoSetDoc = useCallback(setDoc, []);
  const memoDeleteDoc = useCallback(deleteDoc, []);
  const memoResetData = useCallback(resetData, []);

  const lastProcessedEvent = useRef<string | null>(null);
  const MOCK_VERSION = 'v8-autonomous'; // Incremento de versão para limpar caches antigos

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDb = localStorage.getItem(LOCAL_STORAGE_KEY);
      const savedVersion = localStorage.getItem(LOCAL_STORAGE_KEY + '_version');
      
      let finalData = initialMockData;

      if (sessionStorage.getItem('force_simulation_start') === 'true') {
          finalData = {
              ...initialMockData,
              routes: initialMockData.routes.map((r: any) => 
                  (r.id === 'route-1') ? { ...r, journeyStatus: 'em_rota', activeShift: 'Manhã', activeDirection: 'ida' } : r
              ),
              drivers: initialMockData.drivers.map((d: any) => 
                  (d.id === 'driver-1') ? { ...d, status: 'em_rota' } : d
              )
          };
          sessionStorage.removeItem('force_simulation_start');
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(finalData));
          localStorage.setItem(LOCAL_STORAGE_KEY + '_version', MOCK_VERSION);
          setDb(finalData);
      } else if (savedDb) {
        try {
          const parsed = JSON.parse(savedDb);
          
          // Validação estrutural básica para evitar crashes se o formato mudou
          if (typeof parsed !== 'object' || parsed === null || !parsed.users) {
              throw new Error("Formato de dados inválido ou corrompido");
          }

          if (savedVersion !== MOCK_VERSION) {
            setDb(initialMockData);
            localStorage.setItem(LOCAL_STORAGE_KEY + '_version', MOCK_VERSION);
          } else {
            setDb(parsed);
          }
        } catch (e) { 
          console.error("[Guardian] Falha crítica ao recuperar banco mockado. Resetando para segurança.", e);
          setDb(initialMockData);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialMockData));
          localStorage.setItem(LOCAL_STORAGE_KEY + '_version', MOCK_VERSION);
        }
      } else {
        localStorage.setItem(LOCAL_STORAGE_KEY + '_version', MOCK_VERSION);
      }
      setIsInitialized(true);
    }
  }, []);

  // Persistência Debounced (Foco em Qualidade e Performance)
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      const timer = setTimeout(() => {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
      }, 100); // Rapidez para testes E2E
      return () => clearTimeout(timer);
    }
  }, [db, isInitialized]);

  // --- [ERROS & AUDITORIA] RELAY GLOBAL E RECUPERAÇÃO ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Relé Global (Black Box) que funciona fora do React
      (window as any).__guardian_log_error = (errorData: any) => {
        const crashLog = {
          id: `incident-${Date.now()}`,
          category: "Critical Runtime",
          description: errorData.description || "Erro não identificado",
          severity: "Alta",
          reporter: "BlackBox Relay",
          timestamp: new Date().toISOString(),
          metadata: errorData.metadata || {}
        };
        
        try {
          const existing = localStorage.getItem('guardian_crash_stash');
          const stash = existing ? JSON.parse(existing) : [];
          localStorage.setItem('guardian_crash_stash', JSON.stringify([...stash, crashLog]));
          console.warn("[Guardian] Erro gravado na Caixa Preta.");
        } catch (e) {
          console.error("Falha ao gravar na Caixa Preta:", e);
        }
      };

      // 2. Sincronização entre abas (Cross-tab Sync)
      const handleStorageChange = (e: StorageEvent) => {
          if (e.key === LOCAL_STORAGE_KEY && e.newValue) {
              try {
                  const newData = JSON.parse(e.newValue);
                  setDb(newData);
              } catch (err) {
                  console.error("[Guardian] Erro ao sincronizar dados entre abas:", err);
              }
          }
      };
      window.addEventListener('storage', handleStorageChange);

      // 3. Recuperação de logs após crash
      const crashStash = localStorage.getItem('guardian_crash_stash');
      if (crashStash) {
        try {
          const logs = JSON.parse(crashStash);
          if (Array.isArray(logs) && logs.length > 0) {
            setDb(prev => ({
              ...prev,
              incidents: [...(prev.incidents || []), ...logs]
            }));
            localStorage.removeItem('guardian_crash_stash');
            console.log(`[Guardian] Recuperados ${logs.length} logs de auditoria pós-crash.`);
          }
        } catch (e) {
          localStorage.removeItem('guardian_crash_stash');
        }
      }

      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [isInitialized]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isSimulating) {
      interval = setInterval(() => {
        setSimProgress((prev) => (prev + 0.01 >= 1 ? 0 : prev + 0.01));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  useEffect(() => {
    if (isSimulating && simProgress > 0) {
      const point = getRoutePointAt(simProgress);
      memoUpdateDoc('locations', 'driver-1', {
        latitude: point.lat,
        longitude: point.lng,
        timestamp: new Date().toISOString()
      });
      if (point.studentId && point.eventType) {
          const eventKey = `${point.studentId}-${point.eventType}`;
          
          if (lastProcessedEvent.current !== eventKey) {
              lastProcessedEvent.current = eventKey;
              const status = point.eventType === 'pickup' ? 'a_bordo' : 'desembarcado';
              memoUpdateDoc('students', point.studentId, { status });
              
              // Buscar nome do aluno para a notificação
              const studentName = point.studentId === 'student-3' ? 'Bernardo' : point.studentId === 'student-9' ? 'Arthur' : 'Aluno';
              const parentId = point.studentId === 'student-3' ? 'user-pai-2' : point.studentId === 'student-9' ? 'user-pai-1' : 'all';

              // Notificar Pais
              memoAddDoc('notifications', {
                  userId: parentId,
                  title: point.eventType === 'pickup' ? "Van Chegando!" : "Chegada na Escola!",
                  message: point.eventType === 'pickup' 
                    ? `A van iniciou o embarque de ${studentName}.` 
                    : `${studentName} acaba de desembarcar na escola com segurança.`,
                  type: 'success',
                  read: false,
                  timestamp: new Date().toISOString()
              });

              // Registro técnico (Incidentes)
              memoAddDoc('incidents', {
                  category: "Sincronização GPS",
                  description: `Alerta: Van próxima ao local de ${point.eventType === 'pickup' ? 'embarque' : 'entrega'} de ${studentName}.`,
                  severity: "Baixa",
                  reporter: "Guardian System",
                  timestamp: new Date().toISOString(),
                  location: { lat: point.lat, lng: point.lng }
              });
          }
      }
    }
  }, [simProgress, isSimulating, memoUpdateDoc, memoAddDoc]);

  const value = useMemo(() => ({
    db, 
    getCollection: memoGetCollection, 
    getDoc: memoGetDoc, 
    addDoc: memoAddDoc, 
    addDocsBatch: memoAddDocsBatch,
    updateDoc: memoUpdateDoc, 
    clearCollection: memoClearCollection,
    deleteDoc: memoDeleteDoc, 
    getNestedDoc: memoGetNestedDoc, 
    setDoc: memoSetDoc, 
    setIsSimulating, 
    isSimulating, 
    resetData: memoResetData,
    // [NOVO] Função para forçar cenários simulados (Login Rápido)
    forceScenario: (scenario: 'motorista_inicio' | 'monitor_em_rota') => {
        setDb(prev => {
            let newData = JSON.parse(JSON.stringify(prev)); // Deep clone para garantir isolamento
            if (scenario === 'monitor_em_rota') {
                newData.routes = (newData.routes || []).map((r: any) => 
                    r.id === 'route-1' ? { ...r, journeyStatus: 'em_rota', activeShift: 'Manhã', activeDirection: 'ida' } : r
                );
                newData.drivers = (newData.drivers || []).map((d: any) => 
                    d.id === 'driver-1' ? { ...d, status: 'em_rota' } : d
                );
            } else if (scenario === 'motorista_inicio') {
                newData.routes = (newData.routes || []).map((r: any) => 
                    r.id === 'route-1' ? { ...r, journeyStatus: 'pendente' } : r
                );
                newData.drivers = (newData.drivers || []).map((d: any) => 
                    d.id === 'driver-1' ? { ...d, status: 'inativo' } : d
                );
                // Resetar alunos
                // Mantemos os status atuais para permitir testes de fluxo entre personas
                // newData.students = (newData.students || []).map((s: any) => ({ ...s, status: 'aguardando' }));
            }
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newData));
            return newData;
        });
    },
    // [NOVO] Hard reset total
    clearAllAndReset: () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
    },
    // [NOVO] Auxiliar para criar notificações automáticas
    createNotification: (userId: string, title: string, message: string, type: 'info' | 'warning' | 'emergency' | 'success' = 'info') => {
        const newNotif = {
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId,
            title,
            message,
            type,
            read: false,
            createdAt: new Date().toISOString()
        };
        setDb(prev => ({
            ...prev,
            notifications: [newNotif, ...(prev.notifications || [])]
        }));
    }
  }), [db, memoGetCollection, memoGetDoc, memoAddDoc, memoUpdateDoc, memoDeleteDoc, memoGetNestedDoc, memoSetDoc, memoResetData, isSimulating]);

  return (
    <MockDataContext.Provider value={value}>
      {children}
    </MockDataContext.Provider>
  );
}

// --- HOOKS ---
/**
 * Normaliza o valor de NEXT_PUBLIC_DATA_MODE removendo espaços, quebras de linha e aspas acidentais.
 */
export function normalizeDataMode(mode?: string): 'firestore' | 'mock' {
  if (!mode) return 'mock';
  const clean = mode.trim().replace(/^["']|["']$/g, '').trim().toLowerCase();
  return clean === 'firestore' ? 'firestore' : 'mock';
}

export function isFirestoreMode(): boolean {
  if (typeof process === 'undefined') return false;
  return normalizeDataMode(process.env.NEXT_PUBLIC_DATA_MODE) === 'firestore';
}

export const useMockData = () => {
  const context = useContext(MockDataContext);
  if (!context) {
    throw new Error('useData / useMockData must be used within a DataProvider');
  }
  return context;
};

export const useMockCollection = <T = any>(collectionName: keyof MockDB, filters: any[] = []) => {
    const { getCollection, db } = useMockData();
    const filterKey = useMemo(() => JSON.stringify(filters), [filters]);
    
    // Pegamos a versão bruta da coleção para servir de dependência estável
    const rawCollection = db[collectionName];
    
    const data = useMemo(() => {
        return getCollection(collectionName, filters) as T[];
    }, [rawCollection, collectionName, filterKey, getCollection]);
    
    return { data, isLoading: false, error: null };
}

export const useMockDoc = <T = any>(collectionName: keyof MockDB, docId: string | null) => {
    const { getDoc, db } = useMockData();
    const data = useMemo(() => {
      if (collectionName && docId) {
        return getDoc(collectionName, docId) as T | null;
      }
      return null;
    }, [db, collectionName, docId, getDoc]);

    return { data, isLoading: false, error: null };
}

export const useMockNestedDoc = <T = any>(path: string | null) => {
    const { getNestedDoc, db } = useMockData();
     const data = useMemo(() => path ? getNestedDoc(path) as T | null : null, [db, path, getNestedDoc]);
    return { data, isLoading: false, error: null };
}
