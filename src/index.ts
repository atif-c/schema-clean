/**
 * Type alias for plain objects (non-null, non-array objects).
 */
export type PlainObject = Record<string, unknown>;

/**
 * Options for controlling cleaning behavior.
 */
export interface CleanOptions {
	/**
	 * Remove keys/items from input that are not in the template.
	 * @default true
	 */
	removeExtra?: boolean;

	/**
	 * Add missing keys/items from the template to the result.
	 * @default true
	 */
	addDefaults?: boolean;
}

const defaultOptions: Required<CleanOptions> = {
	removeExtra: true,
	addDefaults: true
};

/**
 * Type guard that checks if a value is a plain object (non-null, non-array object).
 *
 * @param value - The value to check
 * @returns `true` if the value is a plain object, `false` otherwise
 */
const isPlainObject = (value: unknown): value is PlainObject => {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
};

/**
 * Checks if a key is unsafe for direct assignment (prototype pollution vector).
 *
 * Assigning to `__proto__` via `obj[key] = value` mutates `Object.prototype`
 * instead of creating an own property. `constructor`/`prototype` enable the
 * same attack via longer chains.
 *
 * @param key - The key to check
 * @returns `true` if the key must not be copied with plain assignment
 */
const isUnsafeKey = (key: string): boolean => {
	return key === '__proto__' || key === 'constructor' || key === 'prototype';
};

/**
 * Deep-clones a template default so callers never receive a live
 * reference into the template object.
 *
 * Without this, mutating `result.nested.x` would mutate `template.nested`
 * for all future `clean()` calls sharing that template.
 *
 * Prefers `structuredClone` when available, falls back to a manual
 * plain-object/array clone (primitives returned as-is).
 *
 * @param value - Template default value to clone
 * @returns A detached copy of the value
 */
const cloneDefault = <T>(value: T): T => {
	if (typeof structuredClone === 'function') {
		try {
			return structuredClone(value);
		} catch {
			// fall through to manual clone (e.g. functions/symbols)
		}
	}
	if (Array.isArray(value)) {
		return value.map(item => cloneDefault(item)) as T;
	}
	if (isPlainObject(value)) {
		const out: PlainObject = {};
		for (const key of Object.keys(value)) {
			out[key] = cloneDefault((value as PlainObject)[key]);
		}
		return out as T;
	}
	return value;
};

/**
 * Recursively cleans an object against a template.
 *
 * For every key in the template:
 * - If the key is missing from the input, the template default is used (unless addDefaults is false).
 * - If the key exists but has the wrong type, the template default is used.
 * - If the value is a nested object, it is cleaned recursively.
 * - If the value is an array, it is cleaned via {@link cleanArray} logic.
 * - Extra keys in the input that are not in the template are discarded (unless removeExtra is false).
 *
 * @template T - The template type (must extend `PlainObject`)
 * @param object - The object to clean
 * @param template - Template defining valid keys and default values
 * @param options - Options to control cleaning behavior
 * @returns A new object matching the template structure
 *
 * @example
 * ```ts
 * const result = cleanObject(
 *   { name: 'Atif', age: '26', extra: true },
 *   { name: '', age: 0, active: false }
 * );
 * // => { name: 'Atif', age: 0, active: false }
 * // - 'age' reset to default 0 (string !== number)
 * // - 'extra' removed (not in template)
 * // - 'active' added with default false
 * ```
 */
export const cleanObject = <T extends PlainObject>(
	object: PlainObject = {},
	template: T,
	options?: CleanOptions
): T => {
	const { removeExtra, addDefaults } = { ...defaultOptions, ...options };
	const result = {} as T;

	for (const key of Object.keys(template)) {
		if (isUnsafeKey(key)) continue;
		const templateValue = template[key];
		const inputValue = object[key];

		if (isPlainObject(templateValue)) {
			if (!isPlainObject(inputValue)) {
				if (addDefaults) {
					(result as PlainObject)[key] = cloneDefault(templateValue);
				}
				continue;
			}
			(result as PlainObject)[key] = cleanObject(inputValue, templateValue, options);
		} else if (Array.isArray(templateValue)) {
			if (!Array.isArray(inputValue)) {
				if (addDefaults) {
					(result as PlainObject)[key] = cloneDefault(templateValue);
				}
				continue;
			}
			(result as PlainObject)[key] = cleanArray(inputValue, templateValue, options);
		} else if (typeof inputValue === typeof templateValue) {
			(result as PlainObject)[key] = inputValue;
		} else if (addDefaults) {
			(result as PlainObject)[key] = cloneDefault(templateValue);
		}
	}

	if (!removeExtra) {
		for (const key of Object.keys(object)) {
			if (isUnsafeKey(key)) continue;
			if (!Object.hasOwn(template, key)) {
				(result as PlainObject)[key] = object[key];
			}
		}
	}

	return result;
};

/**
 * Recursively cleans an array against a template array.
 *
 * Matching strategy:
 * - **Objects** in the input array are matched to template objects by shared keys.
 *   The first input object that shares at least one key with the template object is used.
 * - **Arrays** in the input are matched to template arrays by type (first unmatched
 *   input array is paired with the current template array).
 * - **Primitives** are matched positionally (by template index) and
 *   accepted only if their `typeof` matches the template item.
 *
 * Unmatched template items fall back to their template defaults.
 *
 * Complexity: O(I·K + T·K) total — inputs are indexed once by key.
 *
 * @param inputArray - The array to clean
 * @param templateArray - Template array defining the expected shape and defaults
 * @param options - Options to control cleaning behavior
 * @returns A new array conforming to the template
 */
export const cleanArray = <U>(
	inputArray: unknown[],
	templateArray: U[],
	options?: CleanOptions
): U[] => {
	const { removeExtra, addDefaults } = { ...defaultOptions, ...options };

	if (templateArray.length === 0) return [];
	const result: U[] = [];
	const usedIndices = new Set<number>();

	// Index inputs once: key -> input indices holding it.
	const keyToIndices = new Map<string, number[]>();
	const arrayIndices: number[] = [];
	for (let idx = 0; idx < inputArray.length; idx++) {
		const item = inputArray[idx];
		if (Array.isArray(item)) {
			arrayIndices.push(idx);
		} else if (isPlainObject(item)) {
			for (const key of Object.keys(item)) {
				const list = keyToIndices.get(key);
				if (list) {
					list.push(idx);
				} else {
					keyToIndices.set(key, [idx]);
				}
			}
		}
	}
	const keyCursors = new Map<string, number>();
	let arrayCursor = 0;

	// Peek at the smallest unused input index containing `key`.
	const peekKeyHead = (key: string): number => {
		const list = keyToIndices.get(key);
		if (!list) return Infinity;
		let cursor = keyCursors.get(key) ?? 0;
		while (cursor < list.length && usedIndices.has(list[cursor] as number)) {
			cursor++;
		}
		keyCursors.set(key, cursor);
		return cursor < list.length ? (list[cursor] as number) : Infinity;
	};

	const takeNextArrayIndex = (): number => {
		while (arrayCursor < arrayIndices.length) {
			const candidate = arrayIndices[arrayCursor] as number;
			arrayCursor++;
			if (!usedIndices.has(candidate)) return candidate;
		}
		return -1;
	};

	for (let i = 0; i < templateArray.length; i++) {
		const templateItem = templateArray[i];

		if (Array.isArray(templateItem)) {
			const matchedIndex = takeNextArrayIndex();

			if (matchedIndex !== -1) {
				usedIndices.add(matchedIndex);
				result.push(cleanArray(inputArray[matchedIndex] as unknown[], templateItem, options) as U);
			} else if (addDefaults) {
				result.push(cloneDefault(templateItem) as U);
			}
		} else if (isPlainObject(templateItem)) {
			const templateKeys = Object.keys(templateItem);
			let matchedIndex = -1;

			if (templateKeys.length > 0) {
				let best = Infinity;
				for (const key of templateKeys) {
					const candidate = peekKeyHead(key);
					if (candidate < best) {
						best = candidate;
						if (best === 0) break;
					}
				}
				if (best !== Infinity) matchedIndex = best;
			}

			if (matchedIndex !== -1) {
				usedIndices.add(matchedIndex);
				result.push(
					cleanObject(inputArray[matchedIndex] as PlainObject, templateItem, options) as U
				);
			} else if (addDefaults) {
				result.push(cloneDefault(templateItem) as U);
			}
		} else {
			// Positional by template index; never reuse a consumed slot.
			const inputIndex = i;
			const inputItem = inputIndex < inputArray.length ? inputArray[inputIndex] : undefined;
			if (!usedIndices.has(inputIndex) && typeof inputItem === typeof templateItem) {
				usedIndices.add(inputIndex);
				result.push(inputItem as U);
			} else if (addDefaults) {
				result.push(cloneDefault(templateItem) as U);
			}
		}
	}

	if (!removeExtra) {
		for (let i = 0; i < inputArray.length; i++) {
			if (!usedIndices.has(i)) {
				result.push(inputArray[i] as U);
			}
		}
	}

	return result;
};

/**
 * Recursively cleans a value against a template.
 *
 * This is the primary entry point for the library. It accepts **objects, arrays,
 * or primitives** as the top-level input and delegates to the appropriate
 * cleaning strategy based on the template type:
 *
 * - **Array template** — cleans the input as an array (see {@link cleanArray} for
 *   array-level logic; array items that are objects are cleaned via {@link cleanObject}).
 * - **Object template** — cleans the input as an object, removing unknown keys,
 *   adding missing defaults, and recursing into nested structures.
 * - **Primitive template** — returns the input if its `typeof` matches, otherwise
 *   returns the template default.
 *
 * If the input type does not match the template type (e.g. an array input with an
 * object template), the template default is returned as-is.
 *
 * @template T - The template type
 * @param input - The value to clean (object, array, or primitive)
 * @param template - Template defining the expected shape and default values
 * @param options - Optional options to control cleaning behavior
 * @returns A cleaned value conforming to the template
 *
 * @example
 * ```ts
 * // Cleaning an object
 * const obj = clean(
 *   { name: 'Atif', extra: true },
 *   { name: '', age: 0 }
 * );
 * // => { name: 'Atif', age: 0 }
 * ```
 *
 * @example
 * ```ts
 * // Cleaning a top-level array of objects
 * const array = clean(
 *   [{ id: 1, extra: true }, { id: 2 }],
 *   [{ id: 0, label: '' }]
 * );
 * // => [{ id: 1, label: '' }]
 * // Only the first template item is used as the shape; input items are
 * // matched to template items by shared keys.
 * ```
 *
 * @example
 * ```ts
 * // Cleaning a top-level array of primitives
 * const nums = clean([1, 'oops', 3], [0, 0, 0]);
 * // => [1, 0, 3]
 * ```
 *
 * @example
 * ```ts
 * // With options - keep extra keys
 * const result = clean(
 *   { name: 'Atif', extra: true },
 *   { name: '' },
 *   { removeExtra: false }
 * );
 * // => { name: 'Atif', extra: true }
 * ```
 *
 * @example
 * ```ts
 * // With options - don't add defaults
 * const result = clean(
 *   { name: 'Atif' },
 *   { name: '', age: 0 },
 *   { addDefaults: false }
 * );
 * // => { name: 'Atif' }
 * ```
 */
export const clean = <T>(input: unknown, template: T, options?: CleanOptions): T => {
	// Template is an array
	if (Array.isArray(template)) {
		return Array.isArray(input)
			? (cleanArray(input, template, options) as T)
			: cloneDefault(template);
	}

	// Template is a plain object
	if (isPlainObject(template)) {
		return isPlainObject(input)
			? (cleanObject(input, template, options) as T)
			: cloneDefault(template);
	}

	// Primitive template
	return typeof input === typeof template ? (input as T) : cloneDefault(template);
};
