#!/bin/bash

git fetch
git reset --hard
git pull

regex='\[version\]|rebuild'
text=$(git log -1 --pretty=%B)
[[ $text =~ $regex ]]

if [[ $1 == "-f" || "$BASH_REMATCH[0]" == '[version]'* || "$BASH_REMATCH[0]" == 'Merge'* || "$BASH_REMATCH[0]" == 'rebuild'* ]]; then
cd docker-compose/dev && docker-compose up -d --build app && docker rmi $(docker images -q -f "dangling=true")
cd ../..
./send-telegram-message.sh
fi
