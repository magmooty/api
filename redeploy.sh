#!/bin/bash

rm package-lock.json
npm install
npm run build

output=$(pm2 pid app)

if [ -n "$output" ]; then
  pm2 restart app
else
  pm2 start npm --name app -- start
fi