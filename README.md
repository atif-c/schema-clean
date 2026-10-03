# schema-clean

[![GitHub Repo](https://img.shields.io/badge/GitHub-schema--clean-blue?&logo=github)](https://github.com/atif-c/schema-clean)
[![npm Package](https://img.shields.io/npm/v/schema-clean?logo=npm)](https://npmjs.com/package/schema-clean)

Cleans inputs against a template. Removes extra keys, adds missing keys from template defaults, and resets values with a type mismatch.

## Features

- Cleans objects, arrays, and primitives at the top level
- Removes extra keys
- Adds missing keys from template defaults
- Resets values with a type mismatch to template defaults
- Cleans nested objects and arrays recursively
- Matches array items by shared keys for objects, by type for arrays, by index for primitives
- Options to keep extra keys and skip template defaults
- Zero dependencies, fully typed

## Installation

```bash
npm install schema-clean
```

## Usage

### Cleaning an object

```typescript
import { clean } from 'schema-clean';

const input = { name: 'Atif', age: '26', extra: true };
const template = { name: '', age: 0, active: false };

const result = clean(input, template);
// => { name: 'Atif', age: 0, active: false }
// - 'age' uses template default 0 (string !== number)
// - 'extra' removed (extra key)
// - 'active' added with template default false
```

### Cleaning a top-level array

```typescript
import { clean } from 'schema-clean';

// Array of objects
const users = clean(
	[{ id: 1, extra: true }, { id: 2 }],
	[
		{ id: 0, label: '' },
		{ id: 0, label: '' }
	]
);
// => [{ id: 1, label: '' }, { id: 2, label: '' }]

// Array of primitives
const nums = clean([1, 'oops', 3], [0, 0, 0]);
// => [1, 0, 3]
```

### Nested structures

```typescript
import { clean } from 'schema-clean';

const result = clean(
	{
		users: [{ name: 'Atif', scores: [10, 20, 30], extra: 'remove' }]
	},
	{
		users: [{ name: '', scores: [0, 0], active: true }]
	}
);
// => { users: [{ name: 'Atif', scores: [10, 20], active: true }] }
```

### Type mismatch handling

Returns the template default on a type mismatch. For example, an array input with an object template returns the object template default:

```typescript
clean([1, 2, 3], { name: '', age: 0 });
// => { name: '', age: 0 }

clean({ name: 'Atif' }, [0, 0, 0]);
// => [0, 0, 0]
```

### Using options

The third parameter sets cleaning options:

```typescript
import { clean, cleanArray, cleanObject } from 'schema-clean';
import type { CleanOptions } from 'schema-clean';
```

#### `removeExtra` - Keep extra keys and items

Removes extra keys and items by default. Set `removeExtra: false` to keep them:

```typescript
// Default behavior (removeExtra: true)
clean({ a: 1, b: 2 }, { a: 0 });
// => { a: 1 }

// Keep extra keys
clean({ a: 1, b: 2 }, { a: 0 }, { removeExtra: false });
// => { a: 1, b: 2 }
```

#### `addDefaults` - Skip template defaults for missing keys and items

Adds missing keys and items from template defaults by default. Set `addDefaults: false` to skip them:

```typescript
// Default behavior (addDefaults: true)
clean({ a: 1 }, { a: 0, b: 0 });
// => { a: 1, b: 0 }

// Do not add defaults
clean({ a: 1 }, { a: 0, b: 0 }, { addDefaults: false });
// => { a: 1 }
```

#### Combined options

```typescript
// Keep extra keys, do not add defaults
clean({ a: 1, b: 2, c: 3 }, { a: 0, d: 0 }, { removeExtra: false, addDefaults: false });
// => { a: 1, b: 2, c: 3 }
```

#### Array behavior

For arrays, `removeExtra: false` keeps extra items. `addDefaults: false` skips unmatched template items:

```typescript
// Default: limit to template length, add template defaults
cleanArray([1, 2, 3], [0]);
// => [1]

// Keep all items
cleanArray([1, 2, 3], [0], { removeExtra: false });
// => [1, 2, 3]

// Do not add defaults for missing items
cleanArray([1], [0, 0], { addDefaults: false });
// => [1]
```

## API

### `clean<T>(input: unknown, template: T, options?: CleanOptions): T`

The primary entry point. Cleans objects, arrays, or primitives. Selects the strategy from the template type.

**Parameters:**

- `input` — The input to clean (object, array, or primitive)
- `template` — Template defining the expected shape and template defaults
- `options` — Optional cleaning options

**Returns:** A new value that matches the template.

### `cleanObject<T extends PlainObject>(object: PlainObject, template: T, options?: CleanOptions): T`

Cleans an object against a template. Use it when the input is an object.

**Parameters:**

- `object` — The object to clean
- `template` — Template defining valid keys and template defaults
- `options` — Optional cleaning options

**Returns:** A new object that matches the template.

### `cleanArray<U>(inputArray: unknown[], templateArray: U[], options?: CleanOptions): U[]`

Cleans an input array against a template array.

**Parameters:**

- `inputArray` — The array to clean
- `templateArray` — Template array defining the expected shape and template defaults
- `options` — Optional cleaning options

**Returns:** A new array that matches the template.

### `CleanOptions`

```typescript
interface CleanOptions {
	// Remove extra keys and items
	// Default: true
	removeExtra?: boolean;

	// Add missing keys and items from template defaults
	// Default: true
	addDefaults?: boolean;
}
```

## Array matching strategy

When cleaning arrays, items match by type:

- **Objects** — match template objects by shared keys. Uses the first input object with at least one shared key.
- **Arrays** — match template arrays by type. Uses the first unmatched input array.
- **Primitives** — match by index. Accepts an item only on a `typeof` match.

Unmatched template items use template defaults (unless `addDefaults: false`).

Matching is O(I·K + T·K) total.

## License

MIT
