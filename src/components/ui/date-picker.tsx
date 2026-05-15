import { format, parseISO, isValid } from "date-fns";
import { id as idLocale } from "date-fns/locale/id";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  /** ISO date string YYYY-MM-DD */
  value?: string;
  onChange: (iso: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  fromYear?: number;
  toYear?: number;
}

const toIso = (d: Date) =>
  `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
    .getDate()
    .toString()
    .padStart(2, "0")}`;

export function DatePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal",
  disabled,
  className,
}: DatePickerProps) {
  const date = value ? parseISO(value) : undefined;
  const valid = date && isValid(date) ? date : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !valid && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          {valid ? format(valid, "d MMMM yyyy", { locale: idLocale }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={valid}
          onSelect={(d) => onChange(d ? toIso(d) : undefined)}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
