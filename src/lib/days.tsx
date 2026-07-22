import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "./supabase";
import type { Day, ScheduledDay } from "../types";
import { days as seedDays } from "../data/days";

/** Row shape in the Supabase `days` table (snake_case columns). */
interface DayRow {
  id: string;
  position: number | string | null;
  block_id: number;
  topic: string;
  puzzle: boolean;
  equipment: string;
  prerequisites: string;
  intro: string;
  equations: string;
  diagram: string;
  assembled: string;
  activity: string;
  question: string;
  resources: string;
  created_at?: string;
}

const fromRow = (r: DayRow): Day => ({
  id: r.id,
  position: r.position === null ? null : Number(r.position),
  blockId: r.block_id,
  topic: r.topic,
  puzzle: r.puzzle,
  equipment: r.equipment,
  prerequisites: r.prerequisites,
  intro: r.intro,
  equations: r.equations,
  diagram: r.diagram,
  assembled: r.assembled,
  activity: r.activity,
  question: r.question,
  resources: r.resources,
  created_at: r.created_at,
});

/** Map an app-level patch to DB column names (only blockId differs). */
const toRow = (patch: Partial<Day>): Record<string, unknown> => {
  const { blockId, id: _id, created_at: _c, ...rest } = patch;
  const row: Record<string, unknown> = { ...rest };
  if (blockId !== undefined) row.block_id = blockId;
  return row;
};

/** In-memory fallback built from the hardcoded seed (no backend, or the
 *  `days` table doesn't exist yet). Edits then live only for the session. */
const fallbackDays = (): Day[] =>
  seedDays.map((d) => ({
    id: `seed-${d.day}`,
    position: d.day,
    blockId: d.blockId,
    topic: d.topic,
    puzzle: !!d.puzzle,
    intro: d.intro ?? "",
    activity: d.activity ?? "",
    question: d.question ?? "",
    resources: d.resources ?? "",
    equipment: "",
    prerequisites: "",
    equations: "",
    diagram: "",
    assembled: "",
  }));

interface DaysState {
  loaded: boolean;
  /** calendar days in order, with computed 1-based numbers */
  scheduled: ScheduledDay[];
  /** docked days (position null), oldest first */
  staged: Day[];
  total: number;
  /** owner's edit mode (UI state, per session) */
  editing: boolean;
  setEditing: (b: boolean) => void;
  dayByNumber: (n: number) => ScheduledDay | undefined;
  dayById: (id: string) => Day | undefined;
  updateDay: (id: string, patch: Partial<Day>) => void;
  /** create a blank draft in the staging dock; returns its id */
  addDay: () => string;
  /** schedule/reorder: place `id` before `beforeId`, or at the end (null) */
  moveDay: (id: string, beforeId: string | null) => void;
  /** unschedule: send a day to the staging dock */
  stageDay: (id: string) => void;
  deleteDay: (id: string) => void;
}

const DaysContext = createContext<DaysState | null>(null);

export function DaysProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Day[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  // Whether rows live in Supabase (false = in-memory fallback: skip DB writes).
  const dbBacked = useRef(false);

  useEffect(() => {
    if (!supabase) {
      setItems(fallbackDays());
      setLoaded(true);
      return;
    }
    supabase
      .from("days")
      .select("*")
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          dbBacked.current = true;
          setItems((data as DayRow[]).map(fromRow));
        } else {
          // Table missing (schema.sql not run yet) or empty — never blank.
          setItems(fallbackDays());
        }
        setLoaded(true);
      });
  }, []);

  const scheduled = useMemo(
    () =>
      items
        .filter((d) => d.position !== null)
        .sort((a, b) => (a.position as number) - (b.position as number))
        .map((d, i) => ({ ...d, number: i + 1 })),
    [items],
  );

  const staged = useMemo(
    () =>
      items
        .filter((d) => d.position === null)
        .sort((a, b) => (a.created_at ?? a.id).localeCompare(b.created_at ?? b.id)),
    [items],
  );

  const persist = (id: string, patch: Partial<Day>) => {
    if (!dbBacked.current || !supabase) return;
    supabase.from("days").update(toRow(patch)).eq("id", id).then();
  };

  const updateDay = (id: string, patch: Partial<Day>) => {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    persist(id, patch);
  };

  const addDay = (): string => {
    const draft: Day = {
      id: crypto.randomUUID(),
      position: null,
      blockId: 0,
      topic: "",
      puzzle: false,
      equipment: "",
      prerequisites: "",
      intro: "",
      equations: "",
      diagram: "",
      assembled: "",
      activity: "",
      question: "",
      resources: "",
      created_at: new Date().toISOString(),
    };
    setItems((xs) => [...xs, draft]);
    if (dbBacked.current && supabase) {
      const { created_at: _c, ...day } = draft;
      supabase
        .from("days")
        .insert({ ...toRow(day), id: draft.id })
        .then();
    }
    return draft.id;
  };

  const moveDay = (id: string, beforeId: string | null) => {
    if (id === beforeId) return;
    // Order without the moved day, then take the midpoint of the gap.
    const rest = scheduled.filter((d) => d.id !== id);
    let position: number;
    if (beforeId === null) {
      position = rest.length ? (rest[rest.length - 1].position as number) + 1 : 1;
    } else {
      const at = rest.findIndex((d) => d.id === beforeId);
      if (at === -1) return;
      const next = rest[at].position as number;
      const prev = at > 0 ? (rest[at - 1].position as number) : next - 1;
      position = (prev + next) / 2;
    }
    updateDay(id, { position });
  };

  const stageDay = (id: string) => updateDay(id, { position: null });

  const deleteDay = (id: string) => {
    setItems((xs) => xs.filter((x) => x.id !== id));
    if (dbBacked.current && supabase) {
      supabase.from("days").delete().eq("id", id).then();
    }
  };

  const value: DaysState = {
    loaded,
    scheduled,
    staged,
    total: scheduled.length,
    editing,
    setEditing,
    dayByNumber: (n) => scheduled[n - 1],
    dayById: (id) => items.find((d) => d.id === id),
    updateDay,
    addDay,
    moveDay,
    stageDay,
    deleteDay,
  };

  return <DaysContext.Provider value={value}>{children}</DaysContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useDays = (): DaysState => {
  const ctx = useContext(DaysContext);
  if (!ctx) throw new Error("useDays must be used inside DaysProvider");
  return ctx;
};
