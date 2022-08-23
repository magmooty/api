#!/bin/bash

git fetch
git reset --hard
git pull
cd docker-compose/dev && docker-compose up -d --build app
#docker rm $(docker ps -q -f 'status=exited') && docker rmi $(docker images -q -f "dangling=true")