import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { ShoppingItem } from "../types";
import ShoppingRow from "./ShoppingRow";

export default function ShoppingTable() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoaded(true);
      return;
    }
    supabase
      .from("shopping_items")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setItems(data ?? []);
        setLoaded(true);
      });
  }, []);

  const addItem = async () => {
    const blank = {
      part_name: "",
      what_it_does: "",
      days_required_for: "",
      related_concepts: "",
      link: "",
      purchased: false,
    };
    if (!supabase) {
      setItems((xs) => [...xs, { id: crypto.randomUUID(), ...blank }]);
      return;
    }
    const { data } = await supabase
      .from("shopping_items")
      .insert(blank)
      .select()
      .single();
    if (data) setItems((xs) => [...xs, data]);
  };

  const editItem = (id: string, patch: Partial<ShoppingItem>) => {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    supabase?.from("shopping_items").update(patch).eq("id", id).then();
  };

  const deleteItem = (id: string) => {
    setItems((xs) => xs.filter((x) => x.id !== id));
    supabase?.from("shopping_items").delete().eq("id", id).then();
  };

  return (
    <div className="shop-wrap">
      <table className="shop-table">
        <thead>
          <tr>
            <th style={{ width: 36 }} aria-label="Purchased" />
            <th style={{ width: "18%" }}>Part name</th>
            <th style={{ width: "26%" }}>What it does</th>
            <th style={{ width: "14%" }}>Days required for</th>
            <th style={{ width: "20%" }}>Related concept(s)</th>
            <th>Link</th>
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
        <p className="empty-note">No parts yet — add the first one.</p>
      )}
      <button className="add-btn" onClick={addItem}>
        + Add part
      </button>
    </div>
  );
}
