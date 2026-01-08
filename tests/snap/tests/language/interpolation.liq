# Simple interpolation
x = "Hello #{name}"

# Nested expressions
y = "Result: #{1 + 2 * 3}"

# Function calls in interpolation
z = "Length: #{string.length(s)}"

# Multiple interpolations
multi = "#{a} and #{b} equals #{a + b}"

# INVALID: Top-level double quote in interpolation (grammar catches this)
bad1 = "test: #{"inner"}"

# INVALID: Double quote in nested expression (grammar limitation - cannot catch)
bad2 = "Status: #{if active then "on" end}"

# INVALID: Nested interpolation (grammar limitation - cannot catch)
bad3 = "outer #{x = 'inner #{y}'}"
