#!/bin/bash
mkdir generated
cp ./src/graph/objects/types.ts ./generated/

mkdir generated/value-sets
cp -r ./src/value-sets/i18n ./src/value-sets/sets ./generated/value-sets/