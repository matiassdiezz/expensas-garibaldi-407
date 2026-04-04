export interface Unit {
  uf: number;
  building: "A" | "B" | null; // null = cochera sola
  floor: string | null; // "1°A", "2°B", etc.
  cochera: number | null;
  percent: number; // total % (depto + cochera)
  titular: string;
}

// Prorrateo extraído de liquidación Marzo 2026
// Expensas Comunes Ordinarias (A) y Extraordinarias (B)
export const units: Unit[] = [
  // Departamentos
  { uf: 22, building: "B", floor: "1°A", cochera: 2, percent: 7.84, titular: "AGUIRRE, Ana Maria" },
  { uf: 23, building: "A", floor: "1°B", cochera: 20, percent: 7.45, titular: "TRAVI, Francisco" },
  { uf: 24, building: "B", floor: "1°B", cochera: 9, percent: 7.76, titular: "URCHETTO, Luis" },
  { uf: 25, building: "B", floor: "1°C", cochera: null, percent: 5.24, titular: "FERRERA, Maria Victoria" },
  { uf: 26, building: "A", floor: "1°A", cochera: 21, percent: 6.40, titular: "DIEZ, Gonzalo" },
  { uf: 27, building: "A", floor: "2°A", cochera: 5, percent: 7.84, titular: "NAYMARK, Gerardo" },
  { uf: 28, building: "A", floor: "2°B", cochera: 1, percent: 7.80, titular: "ESTRADA, Maria Teresa" },
  { uf: 29, building: "B", floor: "2°C", cochera: null, percent: 5.11, titular: "FERNANDEZ FERRARI, Carolina" },
  { uf: 30, building: "B", floor: "2°A", cochera: 18, percent: 6.77, titular: "JUDA, Patricia" },
  { uf: 31, building: "A", floor: "3°A", cochera: 4, percent: 7.84, titular: "SCHAER, Nicolas" },
  { uf: 32, building: "A", floor: "3°B", cochera: 3, percent: 7.80, titular: "MARTIN, David" },
  { uf: 33, building: "B", floor: "3°B", cochera: 10, percent: 6.55, titular: "TRAVI, Felipe" },
  { uf: 34, building: "B", floor: "3°C", cochera: null, percent: 5.24, titular: "VILA, Marina" },
  { uf: 35, building: "B", floor: "3°A", cochera: 19, percent: 6.80, titular: "GHERGO, Marta" },
  // Cocheras sueltas (CAMOIRANO)
  { uf: 4, building: null, floor: null, cochera: 6, percent: 0.35, titular: "CAMOIRANO, Angel" },
  { uf: 7, building: null, floor: null, cochera: 7, percent: 0.35, titular: "CAMOIRANO, Angel" },
  { uf: 8, building: null, floor: null, cochera: 8, percent: 0.38, titular: "CAMOIRANO, Angel" },
  { uf: 11, building: null, floor: null, cochera: 11, percent: 0.35, titular: "CAMOIRANO, Angel" },
  { uf: 12, building: null, floor: null, cochera: 12, percent: 0.35, titular: "CAMOIRANO, Angel" },
  { uf: 13, building: null, floor: null, cochera: 13, percent: 0.35, titular: "CAMOIRANO, Angel" },
  { uf: 14, building: null, floor: null, cochera: 14, percent: 0.35, titular: "CAMOIRANO, Angel" },
  { uf: 15, building: null, floor: null, cochera: 15, percent: 0.35, titular: "CAMOIRANO, Angel" },
  { uf: 16, building: null, floor: null, cochera: 16, percent: 0.35, titular: "CAMOIRANO, Angel" },
  { uf: 17, building: null, floor: null, cochera: 17, percent: 0.38, titular: "CAMOIRANO, Angel" },
];

// Solo departamentos (sin cocheras sueltas)
export const apartments = units.filter((u) => u.building !== null);

export function getUnitLabel(unit: Unit): string {
  if (!unit.building) return `Cochera ${unit.cochera}`;
  const cochStr = unit.cochera ? ` + Coch ${unit.cochera}` : "";
  return `${unit.floor} Edif ${unit.building}${cochStr}`;
}

export function getUnitExpense(expensasA: number, percent: number): number {
  return Math.round(expensasA * (percent / 100));
}
