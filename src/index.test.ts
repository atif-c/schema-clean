import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { clean, cleanArray, cleanObject } from './index.js';
import type { PlainObject } from './index.js';

describe('schema-clean', () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	describe('cleanObject()', () => {
		it('preserves values with correct types', () => {
			const value = { name: 'Atif', age: 26, active: true };
			const template = { name: '', age: 0, active: false };

			const resultCleanObject = cleanObject(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanObject).toEqual({ name: 'Atif', age: 26, active: true });
			expect(resultClean).toEqual({ name: 'Atif', age: 26, active: true });
		});

		it('replaces values with wrong types to template defaults', () => {
			const value = { name: true, age: '26', active: 'yes' };
			const template = { name: '', age: 0, active: false };

			const resultCleanObject = cleanObject(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanObject).toEqual({ name: '', age: 0, active: false });
			expect(resultClean).toEqual({ name: '', age: 0, active: false });
		});

		it('removes extra keys not in template', () => {
			const value = { name: 'Atif', extra: true, another: 42 };
			const template = { name: '' };

			const resultCleanObject = cleanObject(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanObject).toEqual({ name: 'Atif' });
			expect(resultCleanObject).not.toHaveProperty('extra');
			expect(resultCleanObject).not.toHaveProperty('another');

			expect(resultClean).toEqual({ name: 'Atif' });
			expect(resultClean).not.toHaveProperty('extra');
			expect(resultClean).not.toHaveProperty('another');
		});

		it('adds missing keys with template defaults', () => {
			const value = { name: 'Atif' };
			const template = { name: '', age: 0, active: true };

			const resultCleanObject = cleanObject(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanObject).toEqual({ name: 'Atif', age: 0, active: true });
			expect(resultClean).toEqual({ name: 'Atif', age: 0, active: true });
		});

		it('returns template defaults when input is empty', () => {
			const resultCleanObject = cleanObject({}, { name: '', age: 0, active: false });
			const resultClean = clean({}, { name: '', age: 0, active: false });

			expect(resultCleanObject).toEqual({ name: '', age: 0, active: false });
			expect(resultClean).toEqual({ name: '', age: 0, active: false });
		});

		it('returns empty object when template is empty', () => {
			const value = { name: 'Atif', age: 26 };
			const template = {};

			const resultCleanObject = cleanObject(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanObject).toEqual({});
			expect(resultClean).toEqual({});
		});

		it('handles objects within object', () => {
			const value = { user: { name: 'Atif', extra: true }, extra: 'true' };
			const template = { user: { name: '', role: 'guest' } };

			const resultCleanObject = cleanObject(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanObject).toEqual({ user: { name: 'Atif', role: 'guest' } });
			expect(resultCleanObject).not.toHaveProperty('extra');

			expect(resultClean).toEqual({ user: { name: 'Atif', role: 'guest' } });
			expect(resultClean).not.toHaveProperty('extra');
		});

		it('handles objects within nested objects', () => {
			const value = {
				a: {
					b: {
						c: { value: 42, extra: true },
						extra: 'remove'
					}
				}
			};
			const template = {
				a: {
					b: {
						c: { value: 0, label: 'default' }
					}
				}
			};

			const resultCleanObject = cleanObject(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanObject).toEqual({
				a: {
					b: {
						c: { value: 42, label: 'default' }
					}
				}
			});
			expect(resultClean).toEqual({
				a: {
					b: {
						c: { value: 42, label: 'default' }
					}
				}
			});
		});

		it('handles arrays within objects', () => {
			const value = { tags: ['a', 'b', 'c'] };
			const template = { tags: ['', ''] };

			const resultCleanObject = cleanObject(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanObject).toEqual({ tags: ['a', 'b'] });
			expect(resultClean).toEqual({ tags: ['a', 'b'] });
		});

		it('handles arrays within nested objects', () => {
			const value = { config: { ids: [1, 2, 3], name: 'test' } };
			const template = { config: { ids: [0, 0], name: '' } };

			const resultCleanObject = cleanObject(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanObject).toEqual({ config: { ids: [1, 2], name: 'test' } });
			expect(resultClean).toEqual({ config: { ids: [1, 2], name: 'test' } });
		});

		it('handles nested objects within arrays', () => {
			const value = {
				users: [
					{ id: 1, name: 'Atif', extra: true },
					{ id: 2, name: 'Barry' }
				]
			};
			const template = { users: [{ id: 0, name: '' }] };

			const resultCleanObject = cleanObject(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanObject).toEqual({ users: [{ id: 1, name: 'Atif' }] });
			expect(resultClean).toEqual({ users: [{ id: 1, name: 'Atif' }] });
		});

		it('handles nested objects within nested arrays', () => {
			const value = { matrix: [[{ x: 1, y: 2, extra: true }], [{ x: 3, y: 4 }]] };
			const template = { matrix: [[{ x: 0, y: 0 }]] };

			const resultCleanObject = cleanObject(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanObject).toEqual({ matrix: [[{ x: 1, y: 2 }]] });
			expect(resultClean).toEqual({ matrix: [[{ x: 1, y: 2 }]] });
		});

		it('handles nested arrays within arrays', () => {
			const value = { grid: [[1, 2, 3], [4, 5], [6]] };
			const template = { grid: [[0, 0]] };

			const resultCleanObject = cleanObject(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanObject).toEqual({ grid: [[1, 2]] });
			expect(resultClean).toEqual({ grid: [[1, 2]] });
		});

		it('handles nested arrays within nested arrays', () => {
			const value = {
				grid: [
					[
						[1, 2],
						[3, 4]
					],
					[[5, 6]]
				]
			};
			const template = { grid: [[[0]]] };

			const resultCleanObject = cleanObject(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanObject).toEqual({ grid: [[[1]]] });
			expect(resultClean).toEqual({ grid: [[[1]]] });
		});

		it('adds default nested object when missing in input', () => {
			const input = {};
			const template = { nested: { value: 0 } };

			const result = cleanObject(input, template);
			expect(result).toEqual({ nested: { value: 0 } });
		});

		it('replaces non-array value with template default when template expects array', () => {
			const value = { items: '0, 1, 2' };
			const template = { items: [0, 1, 2] };

			const resultCleanObject = cleanObject(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanObject).toEqual({ items: [0, 1, 2] });
			expect(resultClean).toEqual({ items: [0, 1, 2] });
		});

		it('handles null key-values in input', () => {
			const value = { count: null };
			const template = { count: 0 };

			const resultCleanObject = cleanObject(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanObject).toEqual({ count: 0 });
			expect(resultClean).toEqual({ count: 0 });
		});

		it('handles null key-values in template', () => {
			const value = { count: 0 };
			const template = { count: null };

			const resultCleanObject = cleanObject(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanObject).toEqual({ count: null });
			expect(resultClean).toEqual({ count: null });
		});

		it('handles undefined key-values in input', () => {
			const value = { count: undefined };
			const template = { count: 0 };

			const resultCleanObject = cleanObject(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanObject).toEqual({ count: 0 });
			expect(resultClean).toEqual({ count: 0 });
		});

		it('handles undefined key-values in template', () => {
			const value = { count: 5 };
			const template = { count: undefined };

			const resultCleanObject = cleanObject(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanObject).toEqual({ count: undefined });
			expect(resultClean).toEqual({ count: undefined });
		});

		it('handles falsy-but-valid input values (0, "", false)', () => {
			const value = { count: 0, label: '', enabled: false };
			const template = { count: 99, label: 'default', enabled: true };

			const resultCleanObject = cleanObject(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanObject).toEqual({ count: 0, label: '', enabled: false });
			expect(resultClean).toEqual({ count: 0, label: '', enabled: false });
		});

		it('handles falsy-but-valid template defaults (0, "", false)', () => {
			const value = { count: 5, label: 'hi', enabled: true };
			const template = { count: 0, label: '', enabled: false };

			const resultCleanObject = cleanObject(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanObject).toEqual({ count: 5, label: 'hi', enabled: true });
			expect(resultClean).toEqual({ count: 5, label: 'hi', enabled: true });

			const value2 = {};

			const resultCleanObject2 = cleanObject(value2, template);
			const resultClean2 = clean(value2, template);

			expect(resultCleanObject2).toEqual({ count: 0, label: '', enabled: false });
			expect(resultClean2).toEqual({ count: 0, label: '', enabled: false });
		});

		it('returns new object reference (does not mutate input)', () => {
			const input = { name: 'Atif', nested: { value: 1 } };
			const template = { name: '', nested: { value: 0 } };
			const result = clean(input, template);

			expect(result).toEqual({ name: 'Atif', nested: { value: 1 } });
			expect(result).not.toBe(input);
			expect((result as Record<string, unknown>).nested).not.toBe(input.nested);
		});

		describe('with CleanOptions', () => {
			it('removes extra keys and adds missing defaults', () => {
				const input = { a: 1, b: 2, c: 3 };
				const template = { a: 0, d: 0 };

				const result = cleanObject(input, template, { removeExtra: true, addDefaults: true });
				expect(result).toEqual({ a: 1, d: 0 });
			});

			it('keeps extra keys and adds missing defaults', () => {
				const input = { a: 1, b: 2, c: 3 };
				const template = { a: 0, d: 0 };

				const result = cleanObject(input, template, { removeExtra: false, addDefaults: true });
				expect(result).toEqual({ a: 1, b: 2, c: 3, d: 0 });
			});

			it('removes extra keys and does not add missing defaults', () => {
				const input = { a: 1, b: 2 };
				const template = { a: 0, c: 0 };

				const result = cleanObject(input, template, { removeExtra: true, addDefaults: false });
				expect(result).toEqual({ a: 1 });
			});

			it('keeps extra keys and does not add missing defaults', () => {
				const input = { a: 1, b: 2, c: 3 };
				const template = { a: 0, d: 0 };

				const result = cleanObject(input, template, { removeExtra: false, addDefaults: false });
				expect(result).toEqual({ a: 1, b: 2, c: 3 });
			});

			it('uses default options when not specified', () => {
				const input = { a: 1, b: 2 };
				const template = { a: 0 };

				const result = cleanObject(input, template);
				expect(result).toEqual({ a: 1 });
			});

			it('works with just removeExtra option', () => {
				const input = { a: 1, b: 2 };
				const template = { a: 0 };

				const result = cleanObject(input, template, { removeExtra: false });
				expect(result).toEqual({ a: 1, b: 2 });
			});

			it('works with just addDefaults option', () => {
				const input = { a: 1 };
				const template = { a: 0, b: 0 };

				const result = cleanObject(input, template, { addDefaults: false });
				expect(result).toEqual({ a: 1 });
			});

			it('applies options to nested objects', () => {
				const input = { user: { name: 'Atif', age: 26, extra: true }, meta: { created: '2026' } };
				const template = { user: { name: '', age: 0 }, meta: { updated: '' } };

				const result = cleanObject(input, template, { removeExtra: false, addDefaults: false });
				expect(result).toEqual({
					user: { name: 'Atif', age: 26, extra: true },
					meta: { created: '2026' }
				});
			});

			it('passes options through clean()', () => {
				const input = { a: 1, b: 2 };
				const template = { a: 0 };

				const result = clean(input, template, { removeExtra: false });
				expect(result).toEqual({ a: 1, b: 2 });
			});
		});
	});

	describe('cleanArray()', () => {
		it('preserves values with correct types', () => {
			const value = [1, 2, 3];
			const template = [0, 0, 0];

			const resultCleanArray = cleanArray(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanArray).toEqual([1, 2, 3]);
			expect(resultClean).toEqual([1, 2, 3]);
		});

		it('replaces values with wrong types to template defaults', () => {
			const value = [1, 'two', 3];
			const template = [0, 0, 0];

			const resultCleanArray = cleanArray(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanArray).toEqual([1, 0, 3]);
			expect(resultClean).toEqual([1, 0, 3]);
		});

		it('removes extra items when input is longer than template', () => {
			const value = [1, 2, 3, 4, 5];
			const template = [0, 0];

			const resultCleanArray = cleanArray(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanArray).toEqual([1, 2]);
			expect(resultClean).toEqual([1, 2]);
		});

		it('adds missing items when input is shorter than template', () => {
			const value = [1];
			const template = [0, 0, 0];

			const resultCleanArray = cleanArray(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanArray).toEqual([1, 0, 0]);
			expect(resultClean).toEqual([1, 0, 0]);
		});

		it('returns template defaults when input is empty', () => {
			const value: number[] = [];
			const template = [0, 0, 0];

			const resultCleanArray = cleanArray(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanArray).toEqual([0, 0, 0]);
			expect(resultClean).toEqual([0, 0, 0]);
		});

		it('returns empty array when template is empty', () => {
			const value = [1, 2, 3];
			const template: number[] = [];

			const resultCleanArray = cleanArray(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanArray).toEqual([]);
			expect(resultClean).toEqual([]);
		});

		it('handles arrays within arrays', () => {
			const value = [
				[1, 2, 3],
				[4, 5]
			];
			const template = [[0, 0]];

			const resultCleanArray = cleanArray(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanArray).toEqual([[1, 2]]);
			expect(resultClean).toEqual([[1, 2]]);
		});

		it('handles arrays within nested arrays', () => {
			const value = [
				[
					[1, 2],
					[3, 4]
				],
				[[5, 6]]
			];
			const template = [[[0, 0]]];

			const resultCleanArray = cleanArray(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanArray).toEqual([[[1, 2]]]);
			expect(resultClean).toEqual([[[1, 2]]]);
		});

		it('handles objects within arrays', () => {
			const value = [
				{ id: 1, name: 'Atif', extra: true },
				{ id: 2, name: 'Barry' }
			];
			const template = [{ id: 0, name: '' }];

			const resultCleanArray = cleanArray(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanArray).toEqual([{ id: 1, name: 'Atif' }]);
			expect(resultClean).toEqual([{ id: 1, name: 'Atif' }]);
		});

		it('handles objects within nested arrays', () => {
			const value = [{ user: { id: 1, name: 'Atif', extra: true } }];
			const template = [{ user: { id: 0, name: '' } }];

			const resultCleanArray = cleanArray(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanArray).toEqual([{ user: { id: 1, name: 'Atif' } }]);
			expect(resultClean).toEqual([{ user: { id: 1, name: 'Atif' } }]);
		});

		it('handles nested objects within arrays', () => {
			const value = [
				{ id: 1, name: 'Atif', extra: true },
				{ id: 2, name: 'Barry' }
			];
			const template = [{ id: 0, name: '' }];

			const resultCleanArray = cleanArray(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanArray).toEqual([{ id: 1, name: 'Atif' }]);
			expect(resultClean).toEqual([{ id: 1, name: 'Atif' }]);
		});

		it('handles nested objects within nested arrays', () => {
			const value = { matrix: [[{ x: 1, y: 2, extra: true }], [{ x: 3, y: 4 }]] };
			const template = { matrix: [[{ x: 0, y: 0 }]] };

			const resultClean = clean(value, template);
			expect(resultClean).toEqual({ matrix: [[{ x: 1, y: 2 }]] });
		});

		it('handles nested arrays within arrays', () => {
			const value = [[1, 2, 3], [4, 5], [6]];
			const template = [[0, 0]];

			const resultCleanArray = cleanArray(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanArray).toEqual([[1, 2]]);
			expect(resultClean).toEqual([[1, 2]]);
		});

		it('handles nested arrays within nested arrays', () => {
			const value = [
				[
					[1, 2],
					[3, 4]
				],
				[[5, 6]]
			];
			const template = [[[0, 0]]];

			const resultCleanArray = cleanArray(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanArray).toEqual([[[1, 2]]]);
			expect(resultClean).toEqual([[[1, 2]]]);
		});

		it('adds default nested array when missing in input', () => {
			const input = [{ not: 'array' }];
			const template = [[0, 0]];

			const result = cleanArray(input, template);
			expect(result).toEqual([[0, 0]]);
		});

		it('replaces non-object value with template default when template expects object', () => {
			const value = [1, 2, 3];
			const template = [{ id: 0, name: '' }];

			const resultCleanArray = cleanArray(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanArray).toEqual([{ id: 0, name: '' }]);
			expect(resultClean).toEqual([{ id: 0, name: '' }]);
		});

		it('handles null key-values in input', () => {
			const value = [null, 2, null];
			const template = [0, 0, 0];

			const resultCleanArray = cleanArray(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanArray).toEqual([0, 2, 0]);
			expect(resultClean).toEqual([0, 2, 0]);
		});

		it('handles null key-values in template', () => {
			const value = [1, 2, 3];
			const template = [0, null, 0];

			const resultCleanArray = cleanArray(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanArray).toEqual([1, null, 3]);
			expect(resultClean).toEqual([1, null, 3]);
		});

		it('handles undefined values in input array', () => {
			const value = [undefined, 2, undefined];
			const template = [0, 0, 0];

			const resultCleanArray = cleanArray(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanArray).toEqual([0, 2, 0]);
			expect(resultClean).toEqual([0, 2, 0]);
		});

		it('handles undefined values in template array', () => {
			const value = [1, 2, 3];
			const template = [0, undefined, 0];

			const resultCleanArray = cleanArray(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanArray).toEqual([1, undefined, 3]);
			expect(resultClean).toEqual([1, undefined, 3]);
		});

		it('handles falsy-but-valid input values (0, "", false)', () => {
			const value = [0, '', false];
			const template = [99, 'default', true];

			const resultCleanArray = cleanArray(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanArray).toEqual([0, '', false]);
			expect(resultClean).toEqual([0, '', false]);
		});

		it('handles falsy-but-valid template defaults (0, "", false)', () => {
			const value = [5, 'hi', true];
			const template = [0, '', false];

			const resultCleanArray = cleanArray(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanArray).toEqual([5, 'hi', true]);
			expect(resultClean).toEqual([5, 'hi', true]);

			const value2: number[] = [];

			const resultCleanArray2 = cleanArray(value2, template);
			const resultClean2 = clean(value2, template);

			expect(resultCleanArray2).toEqual([0, '', false]);
			expect(resultClean2).toEqual([0, '', false]);
		});

		it('returns new array reference (does not mutate input)', () => {
			const input = [1, 2, 3];
			const template = [0, 0, 0];
			const result = cleanArray(input, template);

			expect(result).toEqual([1, 2, 3]);
			expect(result).not.toBe(input);
		});

		describe('with CleanOptions', () => {
			it('limits to template length and adds missing items', () => {
				const input = [1, 2, 3, 4, 5];
				const template = [0, 0];

				const result = cleanArray(input, template, { removeExtra: true, addDefaults: true });
				expect(result).toEqual([1, 2]);
			});

			it('keeps all items and adds defaults for unmatched template items', () => {
				const input = [1, 2, 3];
				const template = [0, 0];

				const result = cleanArray(input, template, { removeExtra: false, addDefaults: true });
				// First 2 template items match input[0], input[1]
				// input[2] is extra and kept (removeExtra: false)
				// No more template items to add defaults from
				expect(result).toEqual([1, 2, 3]);
			});

			it('limits to template length and does not add missing items', () => {
				const input = [1, 2, 3];
				const template = [0, 0, 0, 0];

				const result = cleanArray(input, template, { removeExtra: true, addDefaults: false });
				expect(result).toEqual([1, 2, 3]);
			});

			it('keeps all items and does not add missing items', () => {
				const input = [1, 2];
				const template = [0, 0, 0];

				const result = cleanArray(input, template, { removeExtra: false, addDefaults: false });
				expect(result).toEqual([1, 2]);
			});

			it('uses default options when not specified', () => {
				const input = [1, 2, 3];
				const template = [0];

				const result = cleanArray(input, template);
				expect(result).toEqual([1]);
			});

			it('works with just removeExtra option', () => {
				const input = [1, 2, 3];
				const template = [0];

				const result = cleanArray(input, template, { removeExtra: false });
				expect(result).toEqual([1, 2, 3]);
			});

			it('works with just addDefaults option', () => {
				const input = [1];
				const template = [0, 0];

				const result = cleanArray(input, template, { addDefaults: false });
				expect(result).toEqual([1]);
			});

			it('applies options to objects within arrays', () => {
				const input = [
					{ id: 1, name: 'Atif', extra: true },
					{ id: 2, age: 26 }
				];
				const template = [{ id: 0, name: '' }];

				const result = cleanArray(input, template, { removeExtra: false, addDefaults: false });
				// First object matches template, second is extra and kept (removeExtra: false)
				expect(result).toEqual([
					{ id: 1, name: 'Atif', extra: true },
					{ id: 2, age: 26 }
				]);
			});

			it('passes options through clean()', () => {
				const input = [1, 2, 3];
				const template = [0];

				const result = clean(input, template, { removeExtra: false });
				expect(result).toEqual([1, 2, 3]);
			});
		});
	});

	describe('clean()', () => {
		it('uses object cleaning for object input + object template', () => {
			const result = clean({ name: 'Atif', extra: true }, { name: '', age: 0 });
			expect(result).toEqual({ name: 'Atif', age: 0 });
		});

		it('uses array cleaning for array input + array template', () => {
			const result = clean([1, 2, 3], [0, 0]);
			expect(result).toEqual([1, 2]);
		});

		it('returns template when input is object but template is array', () => {
			const result = clean({ name: 'Atif' }, [0, 0, 0]);
			expect(result).toEqual([0, 0, 0]);
		});

		it('returns template when input is array but template is object', () => {
			const result = clean([1, 2, 3], { name: '', age: 0 });
			expect(result).toEqual({ name: '', age: 0 });
		});

		it('returns template when input is undefined and template is object', () => {
			const result = clean(undefined, [1, 2, 3]);
			expect(result).toEqual([1, 2, 3]);
		});

		it('returns template when input is undefined and template is array', () => {
			const result = clean(undefined, { name: '', age: 0 });
			expect(result).toEqual({ name: '', age: 0 });
		});

		it('returns template when input is null and template is object', () => {
			const result = clean(null, { name: '', age: 0 });
			expect(result).toEqual({ name: '', age: 0 });
		});

		it('returns template when input is null and template is array', () => {
			const result = clean(null, [1, 2, 3]);
			expect(result).toEqual([1, 2, 3]);
		});

		it('handles primitive template with matching input type', () => {
			expect(clean(42, 0)).toBe(42);
			expect(clean('hello', '')).toBe('hello');
			expect(clean(true, false)).toBe(true);
		});

		it('handles primitive template with mismatched input type', () => {
			expect(clean('hello', 0)).toBe(0);
			expect(clean(42, '')).toBe('');
			expect(clean('yes', false)).toBe(false);
		});
	});

	describe('edge cases', () => {
		it('handles large complex structure', () => {
			const input = {
				id: 42,
				meta: {
					created: '2024-01-01',
					tags: ['alpha', 'beta'],
					nested: {
						flag: true,
						items: [{ key: 'a', value: 100, extra: true }],
						extraNested: 'remove'
					},
					extraMeta: 'remove'
				},
				scores: [95, 87, 'invalid'],
				extraTop: 'remove'
			};

			const template = {
				id: 0,
				meta: {
					created: '',
					tags: [''],
					nested: {
						flag: false,
						items: [{ key: '', value: 0 }]
					}
				},
				scores: [0, 0, 0]
			};

			const result = clean(input, template);

			expect(result).toEqual({
				id: 42,
				meta: {
					created: '2024-01-01',
					tags: ['alpha'],
					nested: {
						flag: true,
						items: [{ key: 'a', value: 100 }]
					}
				},
				scores: [95, 87, 0]
			});

			// Verify extra keys are gone
			expect(result).not.toHaveProperty('extraTop');
			expect(result.meta as Record<string, unknown>).not.toHaveProperty('extraMeta');
			expect(
				(result.meta as Record<string, unknown>).nested as Record<string, unknown>
			).not.toHaveProperty('extraNested');
		});

		it('handles NaN in input object', () => {
			const result = cleanObject({ value: NaN }, { value: 0 });
			expect(result).toEqual({ value: NaN });
		});

		it('handles Infinity in input object', () => {
			const result = cleanObject({ value: Infinity }, { value: 0 });
			expect(result).toEqual({ value: Infinity });
		});

		it('handles -Infinity in input object', () => {
			const result = cleanObject({ value: -Infinity }, { value: 0 });
			expect(result).toEqual({ value: -Infinity });
		});

		it('handles NaN in template object', () => {
			const result = cleanObject({ value: 42 }, { value: NaN });
			expect(result).toEqual({ value: 42 });
		});

		it('handles Infinity in template object', () => {
			const result = cleanObject({ value: 42 }, { value: Infinity });
			expect(result).toEqual({ value: 42 });
		});

		it('handles -Infinity in template object', () => {
			const result = cleanObject({ value: 42 }, { value: -Infinity });
			expect(result).toEqual({ value: 42 });
		});

		it('handles NaN in input array', () => {
			const result = cleanArray([NaN, 2, 3], [0, 0, 0]);
			expect(result).toEqual([NaN, 2, 3]);
		});

		it('handles Infinity in input array', () => {
			const result = cleanArray([Infinity, 2, 3], [0, 0, 0]);
			expect(result).toEqual([Infinity, 2, 3]);
		});

		it('handles -Infinity in input array', () => {
			const result = cleanArray([-Infinity, 2, 3], [0, 0, 0]);
			expect(result).toEqual([-Infinity, 2, 3]);
		});

		it('handles NaN in template array', () => {
			const result = cleanArray([1, 2, 3], [0, NaN, 0]);
			expect(result).toEqual([1, 2, 3]);
		});

		it('handles Infinity in template array', () => {
			const result = cleanArray([1, 2, 3], [0, Infinity, 0]);
			expect(result).toEqual([1, 2, 3]);
		});

		it('handles -Infinity in template array', () => {
			const result = cleanArray([1, 2, 3], [0, -Infinity, 0]);
			expect(result).toEqual([1, 2, 3]);
		});
	});

	describe('security (prototype pollution)', () => {
		afterEach(() => {
			Reflect.deleteProperty(Object.prototype, 'polluted');
			Reflect.deleteProperty(Object.prototype, 'p');
		});

		it('does not pollute via input __proto__ with removeExtra:false', () => {
			const value = JSON.parse('{"__proto__":{"polluted":1},"a":1}');
			const template = { a: 0 };

			const resultCleanObject = cleanObject(value, template, { removeExtra: false });
			const resultClean = clean(value, template, { removeExtra: false });

			expect(resultCleanObject).toEqual({ a: 1 });
			expect(resultClean).toEqual({ a: 1 });
			expect(Object.hasOwn(resultCleanObject, '__proto__')).toBe(false);
			expect(Object.hasOwn(resultClean, '__proto__')).toBe(false);
			expect(({} as Record<string, unknown>).polluted).toBeUndefined();
			expect((Object.prototype as Record<string, unknown>).polluted).toBeUndefined();
		});

		it('does not pollute via clean() passthrough with __proto__ input', () => {
			const value = JSON.parse('{"__proto__":{"polluted":1},"a":1}');
			const template = { a: 0 };

			const result = clean(value, template, { removeExtra: false });

			expect(result).toEqual({ a: 1 });
			expect(Object.hasOwn(result, '__proto__')).toBe(false);
			expect(({} as Record<string, unknown>).polluted).toBeUndefined();
		});

		it('skips constructor/prototype keys in input with removeExtra:false', () => {
			const value = JSON.parse('{"constructor":{"polluted":1},"prototype":{"x":1},"a":1}');
			const template = { a: 0 };

			const resultCleanObject = cleanObject(value, template, { removeExtra: false });
			const resultClean = clean(value, template, { removeExtra: false });

			expect(resultCleanObject).toEqual({ a: 1 });
			expect(resultClean).toEqual({ a: 1 });
			expect(Object.hasOwn(resultCleanObject, 'constructor')).toBe(false);
			expect(Object.hasOwn(resultCleanObject, 'prototype')).toBe(false);
			expect(Object.hasOwn(resultClean, 'constructor')).toBe(false);
			expect(Object.hasOwn(resultClean, 'prototype')).toBe(false);
			expect(({} as Record<string, unknown>).polluted).toBeUndefined();
		});

		it('skips malicious __proto__ keys in template', () => {
			const value = { a: 1 };
			const template = JSON.parse('{"__proto__":{"polluted":1},"a":0}');

			const resultCleanObject = cleanObject(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanObject).toEqual({ a: 1 });
			expect(resultClean).toEqual({ a: 1 });
			expect(Object.hasOwn(resultCleanObject, '__proto__')).toBe(false);
			expect(Object.hasOwn(resultClean, '__proto__')).toBe(false);
			expect(({} as Record<string, unknown>).polluted).toBeUndefined();
		});

		it('uses Object.hasOwn (not `in`) for extra-key checks', () => {
			const value = { toString: 'x', a: 1 };
			const template = { a: 0 };

			const resultCleanObject = cleanObject(value, template, { removeExtra: false });
			const resultClean = clean(value, template, { removeExtra: false });

			expect(resultCleanObject).toEqual({ a: 1, toString: 'x' });
			expect(resultClean).toEqual({ a: 1, toString: 'x' });
			expect(Object.hasOwn(resultCleanObject, 'toString')).toBe(true);

			const value2 = { a: 1, hasOwnProperty: 'x' };
			const result2 = cleanObject(value2, template, { removeExtra: false });

			expect(result2).toEqual({ a: 1, hasOwnProperty: 'x' });
			expect(Object.hasOwn(result2, 'hasOwnProperty')).toBe(true);
			expect(Object.keys(result2)).toHaveLength(2);
		});

		it('does not pollute via nested __proto__ payload', () => {
			const value = { nested: JSON.parse('{"__proto__":{"p":1}}') };
			const template = { nested: { x: 0 } };

			const resultCleanObject = cleanObject(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanObject).toEqual({ nested: { x: 0 } });
			expect(resultClean).toEqual({ nested: { x: 0 } });
			expect(({} as Record<string, unknown>).p).toBeUndefined();
			expect(({} as Record<string, unknown>).polluted).toBeUndefined();
		});
	});

	describe('template aliasing', () => {
		it('returns a clone (not a live ref) for missing nested object', () => {
			const template = { nested: { value: 0 } };

			const resultCleanObject = cleanObject({}, template);
			const resultClean = clean({}, template);

			expect(resultCleanObject).toEqual({ nested: { value: 0 } });
			expect(resultClean).toEqual({ nested: { value: 0 } });
			expect(resultCleanObject.nested).not.toBe(template.nested);
			expect((resultClean as typeof template).nested).not.toBe(template.nested);

			resultCleanObject.nested.value = 99;
			expect(template.nested).toEqual({ value: 0 });

			const second = clean({}, template);
			expect(second).toEqual({ nested: { value: 0 } });
		});

		it('returns a clone (not a live ref) for missing nested array', () => {
			const template = { list: [{ id: 0 }] };

			const resultCleanObject = cleanObject({}, template);
			const resultClean = clean({}, template);

			expect(resultCleanObject).toEqual({ list: [{ id: 0 }] });
			expect(resultClean).toEqual({ list: [{ id: 0 }] });
			expect(resultCleanObject.list).not.toBe(template.list);
			expect(resultCleanObject.list[0]).not.toBe(template.list[0]);

			resultCleanObject.list[0].id = 99;
			expect(template.list).toEqual([{ id: 0 }]);
		});

		it('returns a clone for top-level type mismatch', () => {
			const templateObject = { a: { x: 1 } };
			const resultObject = clean('nope', templateObject);

			expect(resultObject).toEqual({ a: { x: 1 } });
			expect(resultObject).not.toBe(templateObject);
			expect(resultObject.a).not.toBe(templateObject.a);

			const templateArray = [{ id: 0 }];
			const resultArray = clean({}, templateArray);

			expect(resultArray).toEqual([{ id: 0 }]);
			expect(resultArray).not.toBe(templateArray);
			expect(resultArray[0]).not.toBe(templateArray[0]);

			resultObject.a.x = 99;
			expect(templateObject.a).toEqual({ x: 1 });
		});

		it('returns a clone for unmatched cleanArray item', () => {
			const template = [{ id: 0 }];

			const resultCleanArray = cleanArray([], template);
			const resultClean = clean([], template);

			expect(resultCleanArray).toEqual([{ id: 0 }]);
			expect(resultClean).toEqual([{ id: 0 }]);
			expect(resultCleanArray[0]).not.toBe(template[0]);
			expect((resultClean as typeof template)[0]).not.toBe(template[0]);
		});

		it('returns primitives by value', () => {
			expect(clean('x', 0)).toBe(0);
			expect(clean(42, '')).toBe('');
		});

		it('detaches even when structuredClone is unavailable (manual fallback)', () => {
			const spy = vi.spyOn(globalThis, 'structuredClone').mockImplementation(() => {
				throw new Error('nope');
			});

			try {
				const template = { nested: { value: 0 } };
				const result = cleanObject({}, template);

				expect(result).toEqual({ nested: { value: 0 } });
				expect(result.nested).not.toBe(template.nested);

				const templateList = { list: [{ id: 0 }] };
				const resultList = cleanObject({}, templateList);

				expect(resultList).toEqual({ list: [{ id: 0 }] });
				expect(resultList.list[0]).not.toBe(templateList.list[0]);
			} finally {
				spy.mockRestore();
			}
		});

		it('returns function values as-is on the manual-clone path', () => {
			// structuredClone throws on functions, so the manual path
			// returns the same fn ref by design.
			const fn = () => 1;
			const template: Record<string, unknown> = { fn };

			const result = clean({}, template);

			expect(result.fn).toBe(fn);
		});
	});

	describe('addDefaults:false with nested structures', () => {
		it('omits missing nested object', () => {
			const template = { nested: { value: 0 } };

			const resultCleanObject = cleanObject({}, template, { addDefaults: false });
			const resultClean = clean({}, template, { addDefaults: false });

			expect(resultCleanObject).toEqual({});
			expect(resultClean).toEqual({});
			expect(resultCleanObject).not.toHaveProperty('nested');
			expect(resultClean).not.toHaveProperty('nested');
		});

		it('omits wrong-typed nested object', () => {
			const template = { nested: { value: 0 } };

			const resultCleanObject = cleanObject({ nested: 42 }, template, { addDefaults: false });
			const resultClean = clean({ nested: 42 }, template, { addDefaults: false });

			expect(resultCleanObject).toEqual({});
			expect(resultClean).toEqual({});
		});

		it('omits missing nested array', () => {
			const template = { list: [0] };

			const resultCleanObject = cleanObject({}, template, { addDefaults: false });
			const resultClean = clean({}, template, { addDefaults: false });

			expect(resultCleanObject).toEqual({});
			expect(resultClean).toEqual({});
		});

		it('omits wrong-typed nested array', () => {
			const template = { list: [0] };

			const resultCleanObject = cleanObject({ list: 'x' }, template, { addDefaults: false });
			const resultClean = clean({ list: 'x' }, template, { addDefaults: false });

			expect(resultCleanObject).toEqual({});
			expect(resultClean).toEqual({});
		});

		it('adds nested defaults by default (positive control, detached)', () => {
			const objectTemplate = { nested: { value: 0 } };
			const resultObject = cleanObject({}, objectTemplate);

			expect(resultObject).toEqual({ nested: { value: 0 } });
			expect(resultObject.nested).not.toBe(objectTemplate.nested);

			const arrayTemplate = { list: [0] };
			const resultArray = cleanObject({}, arrayTemplate);

			expect(resultArray).toEqual({ list: [0] });
			expect(resultArray.list).not.toBe(arrayTemplate.list);
		});

		it('omits keys at the level where deep input is missing or wrong-typed', () => {
			const template = { a: { b: { c: 0 } } };

			const missing = cleanObject({}, template, { addDefaults: false });
			expect(missing).toEqual({});

			const partial = cleanObject({ a: {} }, template, { addDefaults: false });
			expect(partial).toEqual({ a: {} });

			const wrongTyped = cleanObject({ a: { b: 42 } }, template, { addDefaults: false });
			expect(wrongTyped).toEqual({ a: {} });
		});

		it('inherits addDefaults:false in arrays and clean() passthrough', () => {
			const resultCleanArray = cleanArray([{ id: 1 }], [{ id: 0 }, { id: 0 }], {
				addDefaults: false
			});
			const resultClean = clean([{ id: 1 }], [{ id: 0 }, { id: 0 }], {
				addDefaults: false
			});

			expect(resultCleanArray).toEqual([{ id: 1 }]);
			expect(resultClean).toEqual([{ id: 1 }]);
			expect(resultCleanArray).toHaveLength(1);

			const nested = clean({}, { nested: { value: 0 } }, { addDefaults: false });
			expect(nested).toEqual({});
		});

		it('keeps extras but still omits missing nested with removeExtra:false', () => {
			const template = { nested: { value: 0 } };

			const resultCleanObject = cleanObject({ extra: 1 }, template, {
				removeExtra: false,
				addDefaults: false
			});
			const resultClean = clean({ extra: 1 }, template, {
				removeExtra: false,
				addDefaults: false
			});

			expect(resultCleanObject).toEqual({ extra: 1 });
			expect(resultClean).toEqual({ extra: 1 });
		});
	});

	describe('array matching', () => {
		it('does not reuse a consumed object slot for a later primitive', () => {
			const value = [1, { id: 1 }];
			const template = [{ id: 0 }, 0];

			const resultCleanArray = cleanArray(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanArray).toEqual([{ id: 1 }, 0]);
			expect(resultClean).toEqual([{ id: 1 }, 0]);
		});

		it('pairs reordered objects by earliest shared key', () => {
			const value = [{ b: 1 }, { a: 1 }];
			const template = [{ a: 0 }, { b: 0 }];

			const resultCleanArray = cleanArray(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanArray).toEqual([{ a: 1 }, { b: 1 }]);
			expect(resultClean).toEqual([{ a: 1 }, { b: 1 }]);
		});

		it('does not let a non-matching object steal a match', () => {
			const value = [{ c: 9 }, { a: 1 }];
			const template = [{ a: 0 }];

			const resultCleanArray = cleanArray(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanArray).toEqual([{ a: 1 }]);
			expect(resultClean).toEqual([{ a: 1 }]);
		});

		it('guards consumed primitive slots', () => {
			const template = [0, { id: 0 }, 0];

			const alignedCleanArray = cleanArray([1, { id: 1 }, 2], template);
			const alignedClean = clean([1, { id: 1 }, 2], template);

			expect(alignedCleanArray).toEqual([1, { id: 1 }, 2]);
			expect(alignedClean).toEqual([1, { id: 1 }, 2]);

			const shiftedCleanArray = cleanArray([{ id: 1 }, 1, 2], template);
			const shiftedClean = clean([{ id: 1 }, 1, 2], template);

			expect(shiftedCleanArray).toEqual([0, { id: 1 }, 2]);
			expect(shiftedClean).toEqual([0, { id: 1 }, 2]);
		});

		it('preserves nested-array queue order', () => {
			const value = [[9], [1]];
			const template = [[0], [0]];

			const resultCleanArray = cleanArray(value, template);
			const resultClean = clean(value, template);

			expect(resultCleanArray).toEqual([[9], [1]]);
			expect(resultClean).toEqual([[9], [1]]);
		});

		it('appends only unused indices with removeExtra:false (no dupes)', () => {
			const resultCleanArray = cleanArray([1, 2, 3], [0], { removeExtra: false });
			const resultClean = clean([1, 2, 3], [0], { removeExtra: false });

			expect(resultCleanArray).toEqual([1, 2, 3]);
			expect(resultClean).toEqual([1, 2, 3]);
		});

		it('keeps order-stable equivalence spot-checks', () => {
			const primitivesCleanArray = cleanArray([1, 'oops', 3], [0, 0, 0]);
			const primitivesClean = clean([1, 'oops', 3], [0, 0, 0]);

			expect(primitivesCleanArray).toEqual([1, 0, 3]);
			expect(primitivesClean).toEqual([1, 0, 3]);

			const users = clean(
				[{ name: 'Atif', scores: [10, 20, 30], extra: 'remove' }],
				[{ name: '', scores: [0, 0], active: true }]
			);
			expect(users).toEqual([{ name: 'Atif', scores: [10, 20], active: true }]);

			const nestedUsers = clean(
				{ users: [{ name: 'Atif', scores: [10, 20, 30], extra: 'remove' }] },
				{ users: [{ name: '', scores: [0, 0], active: true }] }
			);
			expect(nestedUsers).toEqual({
				users: [{ name: 'Atif', scores: [10, 20], active: true }]
			});
		});

		it('cleans a 2k-item object array quickly (quadratic guard)', () => {
			const input = Array.from({ length: 2000 }, (_, i) => ({ id: i }));
			const template = Array.from({ length: 2000 }, () => ({ id: 0 }));

			const start = Date.now();
			const result = cleanArray(input, template);
			const elapsed = Date.now() - start;

			expect(result).toHaveLength(2000);
			expect(result[0]).toEqual({ id: 0 });
			expect(result[1999]).toEqual({ id: 1999 });
			expect(elapsed).toBeLessThan(2000);
		});

		it.todo('benchmarks clean vs zod/manual with tinybench (PLAN.md:227)');
	});

	describe('characterization (known-unfixed gaps)', () => {
		// Documents CURRENT (buggy) behavior per PLAN.md §§1/5. Each `it.todo`
		// is the desired fix; each passing `it` pins the bug so a future fix
		// shows up as a failure to update.

		it('pins current behavior for circular input with a finite template', () => {
			const input: Record<string, unknown> = {};
			input.self = input;

			const result = clean(input, { self: { x: 0 } });
			expect(result).toEqual({ self: { x: 0 } });
		});

		it.todo('does not hang/crash on circular input (WeakMap/maxDepth)');

		it('throws RangeError for circular template (stack overflow)', () => {
			const input: Record<string, unknown> = {};
			input.self = input;
			const template: Record<string, unknown> = {};
			template.self = template;

			expect(() => clean(input, template)).toThrow(RangeError);
		});

		it.todo('does not hang/crash on circular template (WeakMap/maxDepth)');

		it('pins current Date collapse to {}', () => {
			expect(clean(new Date(0), new Date(0))).toEqual({});
		});

		it.todo('preserves Dates');

		it('pins current Map collapse to {}', () => {
			expect(clean(new Map([['a', 1]]), new Map([['b', 2]]))).toEqual({});
		});

		it.todo('preserves Maps');

		it('pins current Set collapse to {}', () => {
			expect(clean(new Set([1]), new Set([2]))).toEqual({});
		});

		it.todo('preserves Sets');

		it('pins current RegExp collapse to {}', () => {
			expect(clean(/abc/, /def/)).toEqual({});
		});

		it.todo('preserves RegExps');

		it('pins current class-instance collapse to {}', () => {
			class Empty {}
			expect(clean(new Empty(), new Empty())).toEqual({});
		});

		it.todo('preserves class instances');

		it('pins current null-template quirk (object input matches null)', () => {
			const resultCleanObject = cleanObject({ count: { evil: 1 } }, { count: null });
			const resultClean = clean({ count: { evil: 1 } }, { count: null });

			expect(resultCleanObject).toEqual({ count: { evil: 1 } });
			expect(resultClean).toEqual({ count: { evil: 1 } });
		});

		it.todo('null template requires null input');

		it('pins current empty-template array dropping extras with removeExtra:false', () => {
			const resultCleanArray = cleanArray([1, 2], [], { removeExtra: false });
			const resultClean = clean([1, 2], [], { removeExtra: false });

			expect(resultCleanArray).toEqual([]);
			expect(resultClean).toEqual([]);
		});

		it.todo('keeps extras for empty template array with removeExtra:false');
	});

	describe('properties', () => {
		const deepFreeze = (value: unknown): void => {
			if (typeof value !== 'object' || value === null || Object.isFrozen(value)) return;
			Object.freeze(value);
			for (const key of Object.keys(value)) {
				deepFreeze((value as Record<string, unknown>)[key]);
			}
		};

		it('is idempotent for JSON shapes', () => {
			const cases: Array<[unknown, Record<string, unknown> | unknown[]]> = [
				[
					{ a: 1, b: 'x', extra: 1 },
					{ a: 0, b: '' }
				],
				[{ nested: { v: 1, extra: 1 } }, { nested: { v: 0 } }],
				[
					[1, 'oops', 3],
					[0, 0, 0]
				],
				[[{ id: 1, extra: 1 }], [{ id: 0, label: '' }]]
			];

			for (const [input, template] of cases) {
				const once = clean(input, template);
				const twice = clean(input, once);
				expect(twice).toEqual(once);
			}
		});

		it('does not mutate frozen inputs or templates', () => {
			const input = { a: 1, nested: { v: 1, extra: 1 }, list: [1, 2] };
			const template = { a: 0, nested: { v: 0 }, list: [0, 0] };
			const inputSnapshot = JSON.parse(JSON.stringify(input));
			const templateSnapshot = JSON.parse(JSON.stringify(template));

			deepFreeze(input);
			deepFreeze(template);

			const resultCleanObject = cleanObject(input, template);
			const resultClean = clean(input, template);

			expect(resultCleanObject).toEqual({ a: 1, nested: { v: 1 }, list: [1, 2] });
			expect(resultClean).toEqual({ a: 1, nested: { v: 1 }, list: [1, 2] });
			expect(input).toEqual(inputSnapshot);
			expect(template).toEqual(templateSnapshot);
		});

		it('returns detached nested refs (no template sharing)', () => {
			const template = { nested: { value: 0 }, list: [{ id: 0 }] };
			deepFreeze(template);

			const result = clean({}, template) as typeof template;

			expect(result).toEqual({ nested: { value: 0 }, list: [{ id: 0 }] });
			expect(result.nested).not.toBe(template.nested);
			expect(result.list).not.toBe(template.list);
			expect(result.list[0]).not.toBe(template.list[0]);
		});

		it('keeps options monotonic (addDefaults/removeExtra)', () => {
			const input = { a: 1, extra: 1 };
			const template = { a: 0, missing: 0 };

			const noDefaults = cleanObject(input, template, { addDefaults: false });
			expect(noDefaults).toEqual({ a: 1 });
			for (const key of Object.keys(noDefaults)) {
				expect(Object.hasOwn(input, key)).toBe(true);
			}

			const noExtra = cleanObject(input, template, { removeExtra: true });
			expect(noExtra).not.toHaveProperty('extra');
			expect(noExtra).toEqual({ a: 1, missing: 0 });
		});

		it('documents JSON-only scope (functions fall back to typeof)', () => {
			expect(clean(42, 0)).toBe(42);
			expect(clean('hello', 0)).toBe(0);
		});
	});

	describe('types', () => {
		it('exports PlainObject as Record<string, unknown>', () => {
			const o: PlainObject = { a: 1 };
			expectTypeOf(o).toEqualTypeOf<Record<string, unknown>>();
			expect(o).toEqual({ a: 1 });
		});
	});
});
