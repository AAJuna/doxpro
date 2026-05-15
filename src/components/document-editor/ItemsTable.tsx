import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uuid } from "@/lib/utils";
import { calcItemSubtotal } from "@/lib/calc";
import { formatCurrency } from "@/lib/format";
import type { DocumentItem, Product } from "@/types";

interface Props {
  items: DocumentItem[];
  onChange: (items: DocumentItem[]) => void;
  products: Product[];
  documentId: string;
}

export function ItemsTable({ items, onChange, products, documentId }: Props) {
  const update = (idx: number, patch: Partial<DocumentItem>) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    next[idx].subtotal = calcItemSubtotal(next[idx]);
    onChange(next);
  };

  const remove = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const add = () => {
    onChange([
      ...items,
      {
        id: uuid(),
        documentId,
        name: "",
        qty: 1,
        unit: "pcs",
        price: 0,
        taxRate: 0,
        discountPct: 0,
        subtotal: 0,
      },
    ]);
  };

  const pickFromCatalog = (idx: number, productId: string) => {
    const p = products.find((p) => p.id === productId);
    if (!p) return;
    update(idx, {
      productId: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      unit: p.unit,
      taxRate: p.taxRate,
    });
  };

  return (
    <div className="space-y-2">
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="w-8"></th>
              <th className="text-left px-2 py-2 font-medium text-xs">Item</th>
              <th className="text-right px-2 py-2 font-medium text-xs w-20">Qty</th>
              <th className="text-left px-2 py-2 font-medium text-xs w-20">Satuan</th>
              <th className="text-right px-2 py-2 font-medium text-xs w-32">Harga</th>
              <th className="text-right px-2 py-2 font-medium text-xs w-16">Disc%</th>
              <th className="text-right px-2 py-2 font-medium text-xs w-16">Pajak%</th>
              <th className="text-right px-2 py-2 font-medium text-xs w-32">Subtotal</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={it.id} className="border-t">
                <td className="px-1 py-1">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </td>
                <td className="px-1 py-1">
                  <Input
                    list={`products-${idx}`}
                    value={it.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      const match = products.find((p) => p.name === val);
                      if (match) pickFromCatalog(idx, match.id);
                      else update(idx, { name: val, productId: undefined });
                    }}
                    placeholder="Nama item"
                    className="h-8"
                  />
                  <datalist id={`products-${idx}`}>
                    {products.map((p) => (
                      <option key={p.id} value={p.name}>
                        {formatCurrency(p.price)} / {p.unit}
                      </option>
                    ))}
                  </datalist>
                </td>
                <td className="px-1 py-1">
                  <Input
                    type="number"
                    step="0.01"
                    value={it.qty}
                    onChange={(e) => update(idx, { qty: Number(e.target.value) })}
                    className="h-8 text-right"
                  />
                </td>
                <td className="px-1 py-1">
                  <Input
                    value={it.unit}
                    onChange={(e) => update(idx, { unit: e.target.value })}
                    className="h-8"
                  />
                </td>
                <td className="px-1 py-1">
                  <Input
                    type="number"
                    step="0.01"
                    value={it.price}
                    onChange={(e) => update(idx, { price: Number(e.target.value) })}
                    className="h-8 text-right"
                  />
                </td>
                <td className="px-1 py-1">
                  <Input
                    type="number"
                    step="0.01"
                    value={it.discountPct}
                    onChange={(e) => update(idx, { discountPct: Number(e.target.value) })}
                    className="h-8 text-right"
                  />
                </td>
                <td className="px-1 py-1">
                  <Input
                    type="number"
                    step="0.01"
                    value={it.taxRate}
                    onChange={(e) => update(idx, { taxRate: Number(e.target.value) })}
                    className="h-8 text-right"
                  />
                </td>
                <td className="px-2 py-1 text-right font-medium">{formatCurrency(it.subtotal)}</td>
                <td className="px-1 py-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(idx)}
                    className="h-7 w-7"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button variant="outline" size="sm" onClick={add}>
        <Plus className="h-4 w-4" /> Tambah Item
      </Button>
    </div>
  );
}
