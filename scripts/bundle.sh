#!/bin/sh

mkdir -p bundle
browserify browser/reporter.js -p browser-pack-flat > bundle/reporter.js
cp browser/favicon* bundle/
