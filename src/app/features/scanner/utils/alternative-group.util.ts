// Un grupo alternativo es un numero (grupoAlternativo en el modelo, ya
// soportado por el backend) -- esto solo le pone una letra y un color fijos
// para que se pueda VER a simple vista que 2+ tarjetas estan unidas, en vez
// de un interruptor sin ninguna marca visible entre las tarjetas que enlaza
// (confirmado: asi quedaba antes, sin forma de saber cuales estaban juntas).
const ALTERNATIVE_GROUP_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

export interface AlternativeGroupOption {
  value: number;
  letter: string;
}

export const ALTERNATIVE_GROUP_OPTIONS: AlternativeGroupOption[] = ALTERNATIVE_GROUP_LETTERS.map(
  (letter, i) => ({ value: i + 1, letter })
);

export function alternativeGroupLetter(grupoAlternativo: number | undefined): string | undefined {
  return ALTERNATIVE_GROUP_OPTIONS.find(o => o.value === grupoAlternativo)?.letter;
}
