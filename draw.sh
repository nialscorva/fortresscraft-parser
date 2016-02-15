#!/bin/sh

node main.js > graph.dot
/c/Program\ Files\ \(x86\)/Graphviz2.38/bin/dot -ograph.png -Tpng graph.dot
