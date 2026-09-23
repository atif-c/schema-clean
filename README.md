# schema-clean

[![GitHub Repo](https://img.shields.io/badge/GitHub-schema--clean-blue?&logo=github)](https://github.com/atif-c/schema-clean)
[![npm Package](https://img.shields.io/npm/v/schema-clean?logo=npm)](https://npmjs.com/package/schema-clean)

A small utility for recursively enforcing objects and arrays to conform against a schema. Removes unknown keys, adds missing defaults, and resets values whose types don't match the template.

## Features

- Cleans both objects and arrays at the top level
- Removes keys not present in the template
- Adds missing keys with template default values
- Resets values whose `typeof` doesn't match the template
- Recursively handles nested objects and arrays
- Matches array items intelligently (objects by shared keys, primitives by index)
- Configurable options: keep extra keys, skip defaults
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
// - 'age' reset to default 0 (string !== number)
// - 'extra' removed (not in template)
// - 'active' added with default false
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

When the input type doesn't match the template type (e.g. passing an array where the template is an object), the template default is returned:

```typescript
clean([1, 2, 3], { name: '', age: 0 });
// => { name: '', age: 0 }

clean({ name: 'Atif' }, [0, 0, 0]);
// => [0, 0, 0]
```

### Using options

The third parameter controls cleaning behavior:

```typescript
import { clean, cleanArray, cleanObject, CleanOptions } from 'schema-clean';
```

#### `removeExtra` - Keep extra keys/items

By default, keys/items in the input that aren't in the template are removed. Set `removeExtra: false` to keep them:

```typescript
// Default behavior (removeExtra: true)
clean({ a: 1, b: 2 }, { a: 0 });
// => { a: 1 }

// Keep extra keys
clean({ a: 1, b: 2 }, { a: 0 }, { removeExtra: false });
// => { a: 1, b: 2 }
```

#### `addDefaults` - Skip adding missing defaults

By default, missing keys/items from the template are added with their default values. Set `addDefaults: false` to skip:

```typescript
// Default behavior (addDefaults: true)
clean({ a: 1 }, { a: 0, b: 0 });
// => { a: 1, b: 0 }

// Don't add defaults
clean({ a: 1 }, { a: 0, b: 0 }, { addDefaults: false });
// => { a: 1 }
```

#### Combined options

```typescript
// Keep extra, don't add defaults
clean({ a: 1, b: 2, c: 3 }, { a: 0, d: 0 }, { removeExtra: false, addDefaults: false });
// => { a: 1, b: 2, c: 3 }
```

#### Array behavior

For arrays, `removeExtra` controls whether extra items are kept, and `addDefaults` controls whether template items without matches get added:

```typescript
// Default: limit to template length, add defaults
cleanArray([1, 2, 3], [0]);
// => [1]

// Keep all items
cleanArray([1, 2, 3], [0], { removeExtra: false });
// => [1, 2, 3]

// Don't add defaults for missing items
cleanArray([1], [0, 0], { addDefaults: false });
// => [1]
```

## API

### `clean<T>(input: unknown, template: T, options?: CleanOptions): T`

The primary entry point. Accepts objects, arrays, or primitives as input and dispatches to the appropriate cleaning strategy based on the template type.

**Parameters:**

- `input` — The value to clean (object, array, or primitive)
- `template` — Template defining the expected shape and default values
- `options` — Optional options to control cleaning behavior

**Returns:** A new value conforming to the template structure.

### `cleanObject<T>(object: PlainObject, template: T, options?: CleanOptions): T`

Cleans an object against a template. Exported for direct use when you know the input is an object.

**Parameters:**

- `object` — The object to clean
- `template` — Template defining valid keys and default values
- `options` — Optional options to control cleaning behavior

**Returns:** A new object matching the template structure.

### `cleanArray<U>(inputArray: unknown[], templateArray: U[], options?: CleanOptions): U[]`

Cleans an array against a template array.

**Parameters:**

- `inputArray` — The array to clean
- `templateArray` — Template array defining the expected shape and defaults
- `options` — Optional options to control cleaning behavior

**Returns:** A new array conforming to the template.

### `CleanOptions`

```typescript
interface CleanOptions {
	// Remove keys/items from input that are not in the template
	// Default: true
	removeExtra?: boolean;

	// Add missing keys/items from the template to the result
	// Default: true
	addDefaults?: boolean;
}
```

## Array matching strategy

When cleaning arrays, items are matched based on type:

- **Objects** — matched to template objects by shared keys (first input object sharing at least one key with the template object is used)
- **Arrays** — matched by type (first unmatched input array pairs with the current template array)
- **Primitives** — matched positionally by index, accepted only if `typeof` matches

Unmatched template items use their template defaults (unless `addDefaults: false`).

Matching is O(I·K + T·K) total.

## License

MIT
