try
  foo
catch err do
  gni
end

try
  foo
catch err : [err.bla, err.gni] do
  gni
end
