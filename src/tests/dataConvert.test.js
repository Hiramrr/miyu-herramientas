import { describe, it, expect } from 'vitest';
import { csvToJson, jsonToCsv } from '../tools/dataConvert.js';

describe('csvToJson', () => {
  it('keeps a leading empty TSV cell', () => {
    expect(csvToJson('\tventas\tgastos\nenero\t10\t5')).toEqual([{ columna_1: 'enero', ventas: '10', gastos: '5' }]);
  });

  it('rejects duplicated headers and rows with a different column count', () => {
    expect(() => csvToJson('a,a\n1,2')).toThrow('se repite');
    expect(() => csvToJson('a,b\n1,2,3')).toThrow('línea 2 tiene 3 columnas');
    expect(() => csvToJson('a,b\n1')).toThrow('tiene 1 columnas');
  });

  it('keeps quoted newlines and reports unclosed quotes', () => {
    expect(csvToJson('a,b\n"x\ny",2\n3,4')).toEqual([{ a: 'x\ny', b: '2' }, { a: '3', b: '4' }]);
    expect(() => csvToJson('a,b\n"x,2')).toThrow('comillas');
  });
});

describe('jsonToCsv', () => {
  it('serializes nested values instead of [object Object]', () => {
    expect(jsonToCsv('[{"a":{"b":1},"c":[1,2]}]')).toBe('a,c\n"{""b"":1}","[1,2]"');
  });

  it('rejects primitives and mixed lists', () => {
    expect(() => jsonToCsv('5')).toThrow('objeto');
    expect(() => jsonToCsv('[{"a":1}, 2]')).toThrow('elemento 2');
  });

  it('writes lists of lists as rows', () => {
    expect(jsonToCsv('[["a","b"],["1","2"]]')).toBe('a,b\n1,2');
  });
});
