# Simple interpolation
x = "Hello #{name}"

# Nested expressions
y = "Result: #{1 + 2 * 3}"

# Function calls in interpolation
z = "Length: #{string.length(s)}"

# Nested string in interpolation
w = "Msg: #{string.concat([a, " - ", b])}"

# Chained method calls
m = "Value: #{x.to_string().trim()}"

# Conditional in interpolation
c = "Status: #{if active then "on" else "off" end}"

# Multiple interpolations
multi = "#{a} and #{b} equals #{a + b}"

# Complex nested
complex = "Data: #{json.stringify({foo = "bar", count = #{n}})}"
