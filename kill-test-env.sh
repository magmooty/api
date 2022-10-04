#!/bin/bash
pm2 delete test-app

cd src/test

docker-compose down --rmi local