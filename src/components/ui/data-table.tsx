import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  /** Render function. Receives row data. */
  cell: (row: T) => ReactNode;
  /** If provided, column becomes sortable using this accessor */
  sortBy?: (row: T) => string | number;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** Empty state node when data is empty */
  empty?: ReactNode;
  /** Page size (default 25). Pass 0 to disable pagination. */
  pageSize?: number;
  initialSort?: { columnId: string; direction: "asc" | "desc" };
  /** Enable row selection (renders checkbox column). Pass selected ids and handler. */
  selectable?: {
    selectedIds: Set<string>;
    onSelectionChange: (ids: Set<string>) => void;
  };
}

type Direction = "asc" | "desc";

export function DataTable<T>({
  data,
  columns,
  rowKey,
  onRowClick,
  empty,
  pageSize = 25,
  initialSort,
  selectable,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(initialSort?.columnId ?? null);
  const [sortDirection, setSortDirection] = useState<Direction>(initialSort?.direction ?? "asc");
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    if (!sortColumn) return data;
    const col = columns.find((c) => c.id === sortColumn);
    if (!col?.sortBy) return data;
    const fn = col.sortBy;
    const sign = sortDirection === "asc" ? 1 : -1;
    return [...data].sort((a, b) => {
      const av = fn(a);
      const bv = fn(b);
      if (av < bv) return -1 * sign;
      if (av > bv) return 1 * sign;
      return 0;
    });
  }, [data, columns, sortColumn, sortDirection]);

  const paginated = useMemo(() => {
    if (pageSize <= 0) return sorted;
    return sorted.slice(page * pageSize, (page + 1) * pageSize);
  }, [sorted, page, pageSize]);

  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages - 1);

  const toggleSort = (col: DataTableColumn<T>) => {
    if (!col.sortBy) return;
    if (sortColumn !== col.id) {
      setSortColumn(col.id);
      setSortDirection("asc");
    } else if (sortDirection === "asc") {
      setSortDirection("desc");
    } else {
      setSortColumn(null);
    }
  };

  // Selection helpers
  const pageIds = useMemo(() => paginated.map(rowKey), [paginated, rowKey]);
  const allOnPageSelected =
    selectable !== undefined &&
    pageIds.length > 0 &&
    pageIds.every((id) => selectable.selectedIds.has(id));
  const someOnPageSelected =
    selectable !== undefined && pageIds.some((id) => selectable.selectedIds.has(id));

  const togglePageAll = (checked: boolean) => {
    if (!selectable) return;
    const next = new Set(selectable.selectedIds);
    if (checked) pageIds.forEach((id) => next.add(id));
    else pageIds.forEach((id) => next.delete(id));
    selectable.onSelectionChange(next);
  };

  const toggleRow = (id: string, checked: boolean) => {
    if (!selectable) return;
    const next = new Set(selectable.selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    selectable.onSelectionChange(next);
  };

  if (data.length === 0 && empty) {
    return <>{empty}</>;
  }

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            {selectable ? (
              <TableHead className="w-10">
                <Checkbox
                  checked={
                    allOnPageSelected
                      ? true
                      : someOnPageSelected
                        ? "indeterminate"
                        : false
                  }
                  onCheckedChange={(v) => togglePageAll(v === true)}
                  aria-label="Pilih semua"
                />
              </TableHead>
            ) : null}
            {columns.map((col) => (
              <TableHead
                key={col.id}
                className={cn(col.headerClassName, col.sortBy && "cursor-pointer select-none")}
                onClick={() => toggleSort(col)}
              >
                <div className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortBy ? (
                    sortColumn === col.id ? (
                      sortDirection === "asc" ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )
                  ) : null}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.map((row) => {
            const id = rowKey(row);
            const isSelected = selectable?.selectedIds.has(id) ?? false;
            return (
              <TableRow
                key={id}
                className={cn(
                  onRowClick ? "cursor-pointer" : undefined,
                  isSelected && "bg-primary/5",
                )}
                onClick={() => onRowClick?.(row)}
              >
                {selectable ? (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(v) => toggleRow(id, v === true)}
                      aria-label="Pilih baris"
                    />
                  </TableCell>
                ) : null}
                {columns.map((col) => (
                  <TableCell key={col.id} className={col.className}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {pageSize > 0 && totalPages > 1 ? (
        <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
          <div>
            Halaman {safePage + 1} dari {totalPages} · {sorted.length} baris
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
