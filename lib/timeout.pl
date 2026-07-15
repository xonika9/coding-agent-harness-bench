#!/usr/bin/env perl
# timeout.pl <seconds> <cmd...>  -> exit 124 on timeout
use strict; use warnings;
my $t = shift @ARGV;
my $pid = fork();
die "fork: $!" unless defined $pid;
if ($pid == 0) { exec @ARGV or exit 127; }
local $SIG{ALRM} = sub { kill 'TERM', $pid; sleep 2; kill 'KILL', $pid; exit 124; };
alarm $t;
waitpid $pid, 0;
exit($? >> 8);
