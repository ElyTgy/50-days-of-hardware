import type { ShoppingItem, ShoppingStatus } from "../types";
import { SHOPPING_STATUSES } from "../types";
import { useAuth } from "../lib/auth";

interface Props {
  item: ShoppingItem;
  onEdit: (id: string, patch: Partial<ShoppingItem>) => void;
  onDelete: (id: string) => void;
}

const TEXT_FIELDS = [
  ["part_name", "Part name"],
  ["what_it_does", "What it does"],
  ["days_required_for", "e.g. 5, 28, 38"],
  ["related_concepts", "Concepts"],
] as const;

/** First real URL in a cell that may hold notes or several links. */
const firstUrl = (link: string): string => {
  const m = link.match(/https?:\/\/[^\s;,]+/);
  return m ? m[0] : link;
};

/** Short, readable label for a link — its hostname (e.g. "leeselectronic.com"). */
const linkLabel = (link: string): string => {
  try {
    return new URL(firstUrl(link)).hostname.replace(/^www\./, "");
  } catch {
    return "link";
  }
};

export default function ShoppingRow({ item, onEdit, onDelete }: Props) {
  const { canEdit } = useAuth();

  const done = item.purchased || item.status === "owned";

  return (
    <tr className={done ? "purchased" : ""}>
      <td style={{ textAlign: "center" }}>
        <input
          type="checkbox"
          className="shop-check"
          checked={item.purchased}
          disabled={!canEdit}
          onChange={(e) => onEdit(item.id, { purchased: e.target.checked })}
          aria-label="Purchased"
        />
      </td>
      {TEXT_FIELDS.map(([field, placeholder]) => (
        <td key={field}>
          <input
            className="cell-input"
            defaultValue={item[field]}
            placeholder={canEdit ? placeholder : ""}
            readOnly={!canEdit}
            onBlur={(e) => {
              if (canEdit && e.target.value !== item[field]) {
                onEdit(item.id, { [field]: e.target.value });
              }
            }}
          />
        </td>
      ))}
      <td style={{ textAlign: "center" }}>
        <input
          className="cell-input qty-input"
          type="number"
          min={1}
          step={1}
          defaultValue={item.min_quantity ?? 1}
          readOnly={!canEdit}
          onBlur={(e) => {
            if (!canEdit) return;
            const n = Math.max(1, Math.round(Number(e.target.value)) || 1);
            if (n !== (item.min_quantity ?? 1)) {
              onEdit(item.id, { min_quantity: n });
            }
          }}
          aria-label="Minimum quantity"
        />
      </td>
      <td>
        <div className="link-cell">
          {canEdit && (
            <input
              className="cell-input link-input"
              defaultValue={item.link}
              placeholder="https://…"
              onBlur={(e) => {
                if (e.target.value !== item.link) {
                  onEdit(item.id, { link: e.target.value });
                }
              }}
            />
          )}
          {item.link ? (
            <a
              className="link-chip"
              href={firstUrl(item.link)}
              target="_blank"
              rel="noreferrer"
              title={item.link}
            >
              {linkLabel(item.link)}
              <span className="link-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          ) : (
            !canEdit && <span className="link-empty">—</span>
          )}
        </div>
      </td>
      <td>
        <select
          className="status-select"
          data-status={item.status}
          value={item.status}
          disabled={!canEdit}
          onChange={(e) =>
            onEdit(item.id, { status: e.target.value as ShoppingStatus })
          }
          aria-label="Status"
        >
          {SHOPPING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </td>
      <td>
        {canEdit && (
          <button
            className="row-delete"
            onClick={() => onDelete(item.id)}
            title="Delete row"
          >
            ✕
          </button>
        )}
      </td>
    </tr>
  );
}
