# Simple type annotation
def f((x: int)) = x end

# Multiple typed parameters
def g((x: int), (y: string)) = x end

# Optional types
def h((x: int?)) = x end

# Function type
def apply((f: (int) -> int), (x: int)) = f(x) end

# Source type
def process((s: source)) = s end

# Complex source type
def mix((s: source(audio=pcm, video=canvas))) = s end

# List type
def sum((l: [int])) = list.fold(fun (a, b) -> a + b, 0, l) end

# Record type
def get_name((r: {name: string, age: int})) = r.name end

# Nested types
def complex((f: ((int, string) -> bool)?)) = f end

# Type cast in expression
x = (123 : int)
y = (foo : string?)

# Ref type
def update((r: ref)) = r := 0 end
