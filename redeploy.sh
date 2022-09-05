#!/bin/bash

git fetch
git reset --hard
git pull

regex='\[version\]'
text=$(git log -1 --pretty=%B)
[[ $text =~ $regex ]]

if [[ "$BASH_REMATCH[0]" == '[version]'* ]]; then
cd docker-compose/dev && docker-compose up -d --build app && docker rmi $(docker images -q -f "dangling=true")
cd ../..
./send-telegram-message.sh
fi
