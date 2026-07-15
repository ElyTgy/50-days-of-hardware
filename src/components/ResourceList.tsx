import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Resource } from "../types";

export default function ResourceList() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!supabase) {
      setLoaded(true);
      return;
    }
    supabase
      .from("resources")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setResources(data ?? []);
        setLoaded(true);
      });
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    const row = {
      title: title.trim() || url.trim(),
      url: url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`,
    };
    setTitle("");
    setUrl("");
    if (!supabase) {
      setResources((xs) => [...xs, { id: crypto.randomUUID(), ...row }]);
      return;
    }
    const { data } = await supabase.from("resources").insert(row).select().single();
    if (data) setResources((xs) => [...xs, data]);
  };

  const remove = (id: string) => {
    setResources((xs) => xs.filter((x) => x.id !== id));
    supabase?.from("resources").delete().eq("id", id).then();
  };

  return (
    <div className="resource-list">
      {resources.map((r) => (
        <div key={r.id} className="resource-row">
          <a className="resource-title" href={r.url} target="_blank" rel="noreferrer">
            {r.title}
          </a>
          <span className="resource-url">{r.url}</span>
          <button className="row-delete" onClick={() => remove(r.id)} title="Delete">
            ✕
          </button>
        </div>
      ))}
      {loaded && resources.length === 0 && (
        <p className="empty-note">No links yet — add the first one.</p>
      )}
      <form className="resource-add" onSubmit={add}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
        />
        <input
          className="grow"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
        />
        <button className="add-btn" style={{ marginTop: 0 }} type="submit">
          + Add
        </button>
      </form>
    </div>
  );
}
