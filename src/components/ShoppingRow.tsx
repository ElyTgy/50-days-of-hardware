import type { ShoppingItem } from "../types";
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

export default function ShoppingRow({ item, onEdit, onDelete }: Props) {
  const { canEdit } = useAuth();

  return (
    <tr className={item.purchased ? "purchased" : ""}>
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
      <td>
        <div className="link-cell">
          <input
            className="cell-input"
            defaultValue={item.link}
            placeholder={canEdit ? "https://…" : ""}
            readOnly={!canEdit}
            onBlur={(e) => {
              if (canEdit && e.target.value !== item.link) {
                onEdit(item.id, { link: e.target.value });
              }
            }}
          />
          {item.link && (
            <a
              className="link-open"
              href={item.link}
              target="_blank"
              rel="noreferrer"
              title="Open link"
            >
              ↗
            </a>
          )}
        </div>
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
