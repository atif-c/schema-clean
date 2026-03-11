import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clean, cleanArray, cleanObject } from './index.js';

describe('schema-clean', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
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
});
