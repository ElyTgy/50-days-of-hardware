import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import type { ShoppingItem } from "../types";
import { isTruthy, matchColumn, normalizeStatus, parseCsv } from "../lib/csv";
import { SHOPPING_SEED } from "../data/shopping";
import ShoppingRow from "./ShoppingRow";

type NewItem = Omit<ShoppingItem, "id" | "created_at">;

const blankItem = (): NewItem => ({
  part_name: "",
  what_it_does: "",
  days_required_for: "",
  related_concepts: "",
  link: "",
  status: "not ordered",
  purchased: false,
});

export default function ShoppingTable() {
  const { canEdit } = useAuth();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // No backend: show the seed list in-memory so the section isn't empty.
    if (!supabase) {
      setItems(SHOPPING_SEED.map((r) => ({ id: crypto.randomUUID(), ...r })));
      setLoaded(true);
      return;
    }
    supabase
      .from("shopping_items")
      .select("*")
      .order("created_at", { ascending: true })
      .then(async ({ data }) => {
        // First run against an empty table: seed it with the parts list. Only
        // the owner can insert (RLS), so visitors just see whatever is there.
        if (!data || data.length === 0) {
          const seeded = SHOPPING_SEED.map((r, i) => ({
            ...r,
            created_at: new Date(Date.now() + i).toISOString(),
          }));
          const { data: inserted } = await supabase!
            .from("shopping_items")
            .insert(seeded)
            .select();
          setItems(inserted ?? []);
        } else {
          setItems(data);
        }
        setLoaded(true);
      });
  }, []);

  const insertMany = async (rows: NewItem[]) => {
    if (rows.length === 0) return;
    if (!supabase) {
      setItems((xs) => [...xs, ...rows.map((r) => ({ id: crypto.randomUUID(), ...r }))]);
      return;
    }
    const { data } = await supabase.from("shopping_items").insert(rows).select();
    if (data) setItems((xs) => [...xs, ...data]);
  };

  const addItem = () => insertMany([blankItem()]);

  const editItem = (id: string, patch: Partial<ShoppingItem>) => {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    supabase?.from("shopping_items").update(patch).eq("id", id).then();
  };

  const deleteItem = (id: string) => {
    setItems((xs) => xs.filter((x) => x.id !== id));
    supabase?.from("shopping_items").delete().eq("id", id).then();
  };

  const importCsv = async (file: File) => {
    const rows = parseCsv(await file.text());
    if (rows.length === 0) {
      setNotice("That file looked empty.");
      return;
    }
    const header = rows[0].map(matchColumn);
    const hasHeader = header.some(Boolean);
    const dataRows = hasHeader ? rows.slice(1) : rows;
    // Fall back to fixed column order when there's no recognizable header.
    const cols = hasHeader
      ? header
      : ["part_name", "what_it_does", "days_required_for", "related_concepts", "link", "status", "purchased"];

    const parsed: NewItem[] = dataRows.map((cells) => {
      const item = blankItem();
      cols.forEach((col, i) => {
        const value = (cells[i] ?? "").trim();
        if (!col) return;
        if (col === "purchased") item.purchased = isTruthy(value);
        else if (col === "status") item.status = normalizeStatus(value);
        else (item as Record<string, unknown>)[col] = value;
      });
      return item;
    });

    await insertMany(parsed);
    setNotice(`Imported ${parsed.length} ${parsed.length === 1 ? "part" : "parts"}.`);
  };

  return (
    <div className="shop-wrap">
      <table className="shop-table">
        <thead>
          <tr>
            <th style={{ width: 36 }} aria-label="Purchased" />
            <th style={{ width: "17%" }}>Part name</th>
            <th style={{ width: "24%" }}>What it does</th>
            <th style={{ width: "12%" }}>Days required for</th>
            <th style={{ width: "18%" }}>Related concept(s)</th>
            <th>Link</th>
            <th style={{ width: 150 }}>Status</th>
            <th style={{ width: 36 }} aria-label="Delete" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <ShoppingRow
              key={item.id}
              item={item}
              onEdit={editItem}
              onDelete={deleteItem}
            />
          ))}
        </tbody>
      </table>

      {loaded && items.length === 0 && (
        <p className="empty-note">
          {canEdit ? "No parts yet — add one or import a CSV." : "No parts yet."}
        </p>
      )}

      {canEdit && (
        <>
          <div className="shop-actions">
            <button className="add-btn" onClick={addItem}>
              + Add part
            </button>
            <button className="add-btn" onClick={() => fileRef.current?.click()}>
              ↑ Import CSV
            </button>
            {notice && <span className="shop-notice">{notice}</span>}
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importCsv(file);
                e.target.value = "";
              }}
            />
          </div>
          <p className="shop-hint">
            CSV columns: part name, what it does, days required for, related
            concept(s), link, status, purchased. A header row is detected
            automatically.
          </p>
        </>
      )}
    </div>
  );
}
