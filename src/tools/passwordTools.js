export const PASSWORD_LABELS = ['Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte'];

// Uniform pick without modulo bias.
export function randomPassword(length, charset, getRandomValues = (array) => crypto.getRandomValues(array)) {
  const chars = Array.from(charset);
  const limit = Math.floor(0x100000000 / chars.length) * chars.length;
  const buffer = new Uint32Array(1);
  let result = '';
  while (result.length < length) {
    getRandomValues(buffer);
    if (buffer[0] < limit) result += chars[buffer[0] % chars.length];
  }
  return result;
}

const COMMON_WORDS = [
  'password', 'passwd', 'contrasena', 'contraseña', 'clave', 'secreto', 'secret', 'admin', 'administrador', 'usuario',
  'login', 'root', 'qwerty', 'azerty', 'welcome', 'bienvenido', 'hola', 'holamundo', 'teamo', 'iloveyou', 'amor',
  'letmein', 'monkey', 'dragon', 'master', 'shadow', 'superman', 'batman', 'pokemon', 'football', 'futbol', 'soccer',
  'baseball', 'sunshine', 'princess', 'princesa', 'mexico', 'espana', 'españa', 'argentina', 'colombia', 'america',
  'prueba', 'test', 'changeme', 'default', 'google', 'facebook', 'miyu'
];
const KEYBOARD_ROWS = ['1234567890', 'qwertyuiop', 'asdfghjklñ', 'zxcvbnm'];
const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', '@': 'a', $: 's', '!': 'i' };

function isStep(previous, current) {
  const a = previous.toLowerCase();
  const b = current.toLowerCase();
  if (/[a-z0-9]/.test(a) && /[a-z0-9]/.test(b) && Math.abs(a.charCodeAt(0) - b.charCodeAt(0)) === 1) return true;
  return KEYBOARD_ROWS.some((row) => {
    const i = row.indexOf(a);
    const j = row.indexOf(b);
    return i >= 0 && j >= 0 && Math.abs(i - j) === 1;
  });
}

function poolSize(chars) {
  let size = 0;
  if (chars.some((c) => /[a-z]/.test(c))) size += 26;
  if (chars.some((c) => /[A-Z]/.test(c))) size += 26;
  if (chars.some((c) => /[0-9]/.test(c))) size += 10;
  if (chars.some((c) => /[\x20-\x7e]/.test(c) && !/[a-zA-Z0-9]/.test(c))) size += 33;
  if (chars.some((c) => c > '\x7e')) size += 30;
  return size;
}

// Heuristic, not a guarantee: counts only characters that a pattern would not predict.
export function evaluatePassword(password) {
  const chars = Array.from(password).slice(0, 256);
  const lower = chars.map((c) => c.toLocaleLowerCase('es'));
  const predictable = new Array(chars.length).fill(false);
  const issues = new Set();

  for (let i = 1; i < chars.length; i++) {
    if (lower[i] === lower[i - 1]) { predictable[i] = true; issues.add('Repite caracteres seguidos.'); }
    else if (isStep(lower[i - 1], lower[i])) { predictable[i] = true; issues.add('Contiene secuencias como abc, 123 o qwerty.'); }
  }
  for (let i = 2; i < chars.length; i++) {
    for (let size = Math.min(i, chars.length - i); size >= 2; size--) {
      if (lower.slice(i - size, i).join('') === lower.slice(i, i + size).join('')) {
        for (let k = i; k < i + size; k++) predictable[k] = true;
        issues.add('Repite un mismo bloque.');
        break;
      }
    }
  }
  const plain = lower.map((c) => LEET[c] || c);
  for (const word of COMMON_WORDS) {
    const letters = Array.from(word);
    for (let at = 0; at + letters.length <= plain.length; at++) {
      if (!letters.every((letter, k) => plain[at + k] === letter)) continue;
      // The whole word counts as two guesses: it is in every attacker's list.
      for (let k = at + 2; k < at + letters.length; k++) predictable[k] = true;
      issues.add('Contiene una palabra o contraseña muy común.');
    }
  }

  const effective = predictable.filter((value) => !value).length;
  const bits = Math.round(effective * Math.log2(poolSize(chars) || 1));
  let score = bits < 28 ? 0 : bits < 40 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4;
  if (chars.length < 8) { score = Math.min(score, 1); issues.add('Usa al menos 12 caracteres.'); }
  else if (chars.length < 12) score = Math.min(score, 3);
  if (issues.has('Contiene una palabra o contraseña muy común.')) score = Math.min(score, 1);
  return { score, label: PASSWORD_LABELS[score], bits, issues: [...issues] };
}
