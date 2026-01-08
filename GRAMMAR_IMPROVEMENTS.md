# Liquidsoap Grammar Improvements

Analysis based on comparing the current TextMate grammar with:
- The official parser: https://github.com/savonet/liquidsoap/blob/main/src/lang/parser.mly
- The tree-sitter grammar: https://github.com/savonet/tree-sitter-liquidsoap
- The standard library files: https://github.com/savonet/liquidsoap/tree/main/src/libs

## Missing Keywords

### 1. `finally` clause in try-catch-finally
**Status:** Missing
**Example:**
```liquidsoap
try
  risky_operation()
catch e do
  handle_error(e)
finally
  cleanup()
end
```
**Fix:** Add `finally` to the try expression pattern.

### 2. `open` keyword for module imports
**Status:** Missing
**Example:**
```liquidsoap
open native
```
**Fix:** Add pattern for `open <module_name>` syntax.

### 3. `%include` and `%include_extra` directives
**Status:** Missing
**Example:**
```liquidsoap
%include "error.liq"
%include_extra "extra/file.liq"
```
**Fix:** Add these to the preprocessor directives pattern.

## Missing Operators

### 1. `mod` operator (modulo)
**Status:** Missing
**Example:**
```liquidsoap
x = 10 mod 3  # Returns 1
```
**Fix:** Add `mod` as a keyword operator.

### 2. Dereference operator `!`
**Status:** Missing
**Example:**
```liquidsoap
x = ref(5)
y = !x  # Dereference to get value
```
**Fix:** Add pattern for `!` prefix operator.

### 3. Floating-point specific operators
**Status:** Missing
**Example:**
```liquidsoap
x = 1.0 +. 2.0
y = 3.0 *. 4.0
```
**Fix:** The current grammar partially handles these via `[+\-/*]\.?` but should be more explicit.

## Missing/Incomplete Doc Comment Tags

### Current tags handled:
- `@param`
- `@category`
- `@argsof`

### Missing tags:
- `@flag` - Used extensively in stdlib for `@flag hidden`
- `@docof` - For documentation references

**Fix:** Add these to the `comments-doc` pattern.

## Grammar Pattern Issues

### 1. Function definition highlighting inconsistency
**Issue:** `def` keyword is captured as `keyword.control.liquidsoap` in some patterns but should be `keyword.other.function.definition.liquidsoap`.

**Current behavior:** The `def-expression-binding` pattern correctly captures `def` but nested `def` within blocks gets generic highlighting.

### 2. String interpolation scope nesting
**Issue:** The string interpolation `#{...}` captures expressions but the scope names could be more specific for better theme support.

### 3. Type annotation ending pattern
**Status:** Not an issue - works correctly with proper syntax.
**Note:** Liquidsoap requires double parentheses for typed parameters: `def f((x: int)) = ...`

### 4. Integer literal patterns
**Issue:** Hexadecimal pattern `0(x|X)[0-9][0-9a-fA-F_]+` requires at least 2 hex digits. Single digit hex like `0x0` won't match correctly.

**Fix:** Change to `0(x|X)[0-9a-fA-F][0-9a-fA-F_]*`

### 5. Octal literal pattern
**Issue:** Pattern `0(o|O)[0-9][0-9_]+` uses `[0-9]` instead of `[0-7]` for octal digits.

**Fix:** Change to `0(o|O)[0-7][0-7_]*`

## Recommended Fixes

### Priority 1: Critical Missing Features

```json
// Add to keywords patterns
{
  "name": "keyword.operator.modulo.liquidsoap",
  "match": "\\bmod\\b"
},
{
  "name": "keyword.operator.dereference.liquidsoap",
  "match": "!(?=[a-zA-Z_])"
},
{
  "name": "keyword.other.liquidsoap",
  "match": "\\bopen\\b"
}
```

```json
// Add finally to try expression
{
  "match": "\\b(catch|finally)\\b",
  "name": "keyword.control.liquidsoap"
}
```

```json
// Add to preprocessor directives
{
  "name": "keyword.other.liquidsoap",
  "match": "(%include_extra|%include)\\b"
}
```

### Priority 2: Doc Comment Improvements

```json
// Add to comments-doc patterns
{
  "match": "@flag",
  "name": "comment.doc.flag.liquidsoap"
},
{
  "match": "@docof",
  "name": "comment.doc.docof.liquidsoap"
}
```

### Priority 3: Literal Pattern Fixes

```json
// Fix hexadecimal pattern
{
  "match": "\\b0(x|X)[0-9a-fA-F][0-9a-fA-F_]*\\b",
  "name": "constant.numeric.hexadecimal.integer.liquidsoap"
}
```

```json
// Fix octal pattern
{
  "match": "\\b0(o|O)[0-7][0-7_]*\\b",
  "name": "constant.numeric.octal.integer.liquidsoap"
}
```

## Test Suite

A test suite has been created in `test-suite/` to validate these changes:

```bash
# Fetch the standard library files
pnpm run test:fetch-stdlib

# Run grammar tests and generate HTML output
pnpm run test:stdlib

# Or run both
pnpm run test:stdlib:full
```

Results are generated in `test-suite/output/index.html` with:
- All files syntax highlighted
- Hoverable tokens showing scope information
- Issue detection for unhighlighted constructs

## Comparison with Tree-Sitter Grammar

The tree-sitter grammar at https://github.com/savonet/tree-sitter-liquidsoap provides a complete reference. Key differences:

| Feature | TextMate Grammar | Tree-Sitter |
|---------|-----------------|-------------|
| `finally` | Missing | Supported |
| `open` | Missing | Supported |
| `mod` | Missing | Supported |
| `%include` | Missing | Supported |
| Nested comments | Partial | Full |
| Pattern matching | Good | Full |

## Implementation Priority

1. **High:** `finally`, `mod`, `%include` - Used in stdlib
2. **Medium:** `open`, `!` dereference - Less common but important
3. **Low:** Doc tags, literal fixes - Minor improvements
