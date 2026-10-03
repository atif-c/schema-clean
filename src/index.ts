/**
 * Type alias for plain objects (non-null, non-array objects).
 */
export type PlainObject = Record<string, unknown>;

/**
 * Options for controlling cleaning behavior.
 */
export interface CleanOptions {
	/**
	 * Removes extra keys and items.
	 * @default true
	 */
	removeExtra?: boolean;

	/**
	 * Adds missing keys and items from template defaults.
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
 * @param value - Template default to clone
 * @returns A detached copy of the value
 */
const cloneDefault = <T>(value: T): T => {
	if (typeof structuredClone === 'function') {
		try {
			return structuredClone(value);
		} catch {
			// Falls through to manual clone for functions and symbols.
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
 * Cleans an object against a template.
 *
 * For every key in the template:
 * - Uses the template default for a missing key, unless `addDefaults` is false.
 * - Uses the template default on a type mismatch.
 * - Cleans a nested object recursively.
 * - Cleans an array with {@link cleanArray} logic.
 * - Discards extra keys, unless `removeExtra` is false.
 *
 * @template T - The template type (must extend `PlainObject`)
 * @param object - The object to clean
 * @param template - Template defining valid keys and template defaults
 * @param options - Optional cleaning options
 * @returns A new object that matches the template
 *
 * @example
 * ```ts
 * const result = cleanObject(
 *   { name: 'Atif', age: '26', extra: true },
 *   { name: '', age: 0, active: false }
 * );
 * // => { name: 'Atif', age: 0, active: false }
 * // - 'age' uses template default 0 (string !== number)
 * // - 'extra' removed (extra key)
 * // - 'active' added with template default false
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
 * Cleans an input array against a template array.
 *
 * Matching strategy:
 * - **Objects** match template objects by shared keys.
 *   Uses the first input object with at least one shared key.
 * - **Arrays** match template arrays by type.
 *   Uses the first unmatched input array.
 * - **Primitives** match by template index.
 *   Accepts an item only on a `typeof` match.
 *
 * Unmatched template items use template defaults.
 *
 * Complexity: O(I·K + T·K) total. Inputs are indexed once by key.
 *
 * @param inputArray - The array to clean
 * @param templateArray - Template array defining the expected shape and template defaults
 * @param options - Optional cleaning options
 * @returns A new array that matches the template
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
 * Cleans an input against a template.
 *
 * This is the primary entry point. Cleans objects, arrays, or primitives.
 * Selects the strategy from the template type:
 *
 * - **Array template** — cleans the input as an array with {@link cleanArray}.
 * - **Object template** — cleans the input as an object. Removes extra keys,
 *   adds missing keys from template defaults, and cleans nested structures.
 * - **Primitive template** — returns the input on a `typeof` match.
 *   Otherwise returns the template default.
 *
 * Returns the template default as-is on a type mismatch.
 * For example, an array input with an object template returns the object template default.
 *
 * @template T - The template type
 * @param input - The input to clean (object, array, or primitive)
 * @param template - Template defining the expected shape and template defaults
 * @param options - Optional cleaning options
 * @returns A cleaned value that matches the template
 *
 * @example
 * ```ts
 * // Cleans an object
 * const obj = clean(
 *   { name: 'Atif', extra: true },
 *   { name: '', age: 0 }
 * );
 * // => { name: 'Atif', age: 0 }
 * ```
 *
 * @example
 * ```ts
 * // Cleans a top-level array of objects
 * const array = clean(
 *   [{ id: 1, extra: true }, { id: 2 }],
 *   [{ id: 0, label: '' }]
 * );
 * // => [{ id: 1, label: '' }]
 * // Uses only the first template item as the shape.
 * // Matches input items by shared keys.
 * ```
 *
 * @example
 * ```ts
 * // Cleans a top-level array of primitives
 * const nums = clean([1, 'oops', 3], [0, 0, 0]);
 * // => [1, 0, 3]
 * ```
 *
 * @example
 * ```ts
 * // Keeps extra keys
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
 * // Skips template defaults
 * const result = clean(
 *   { name: 'Atif' },
 *   { name: '', age: 0 },
 *   { addDefaults: false }
 * );
 * // => { name: 'Atif' }
 * ```
 */
export const clean = <T>(input: unknown, template: T, options?: CleanOptions): T => {
	if (Array.isArray(template)) {
		return Array.isArray(input)
			? (cleanArray(input, template, options) as T)
			: cloneDefault(template);
	}

	if (isPlainObject(template)) {
		return isPlainObject(input)
			? (cleanObject(input, template, options) as T)
			: cloneDefault(template);
	}

	return typeof input === typeof template ? (input as T) : cloneDefault(template);
};
