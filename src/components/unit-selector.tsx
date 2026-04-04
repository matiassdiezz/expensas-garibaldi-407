"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apartments, getUnitLabel, Unit } from "@/lib/units";

interface UnitSelectorProps {
  selectedUf: number;
  onSelect: (uf: number) => void;
}

export function UnitSelector({ selectedUf, onSelect }: UnitSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-muted-foreground whitespace-nowrap">
        Tu departamento:
      </label>
      <Select
        value={String(selectedUf)}
        onValueChange={(v) => v && onSelect(Number(v))}
      >
        <SelectTrigger className="w-[260px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {apartments.map((unit: Unit) => (
            <SelectItem key={unit.uf} value={String(unit.uf)}>
              UF {unit.uf} · {getUnitLabel(unit)} ({unit.percent}%)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
