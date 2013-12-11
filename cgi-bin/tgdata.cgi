#!/usr/bin/env ruby

require 'json'
require 'cgi'

log = File.open('/tmp/tg', 'a');
x = 0
cgi = CGI.new

puts cgi.header('text/json')

File.open('/home/gam3/src/tgtable/count', 'r') do |file|
  file.each_line do |line|
    x = line.chomp;
    x = x.to_f
    break if x.to_i
  end
end
#x += 1
File.open('/tmp/xxxx', 'w') do |file|
  file.puts x
end
rows = 20 + x.to_i
log.puts "#{x} #{rows}"

hash = Hash.new
hash[:rows] = rows;

if cgi.params['start'].size > 0
  ret = Array.new
  bottom = false
  start = cgi.params['start'][0].to_i
  count = cgi.params['size'][0].to_i
  if cgi.params.include? 'bottom'
    bottom = true
  end
  hash[:start] = start;
  hash[:size] = count;
  if start + count > rows + 1
    hash[:fix] = true;
  else
    final = start + count
    hash[:start] = start;
    hash[:final] = final;
    (start ... final).each_with_index do |x, i|
      name = %W[ C A B ][x % 3]
      ret.push [ x, name, [[ 'blue', 'green' ][x % 2], "%2d" % i, bottom ].join(' ') ]
    end
    hash[:data] = ret
  end
  puts JSON.dump hash
else
  puts JSON.dump hash
end

