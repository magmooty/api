#!/bin/bash

output=$(pm2 pid test-app)

if [ -n "$output" ]; then
  pm2 del test-app
fi

rm -rf ~/.pm2/logs/test-app*.log

cd src/test

docker-compose down --rmi local
docker volume rm $(docker volume ls -q | grep test_local_)
docker-compose up -d
docker logs -f local_test_kafka | grep -q "Starting the log cleaner"

cd ../../

npm run build
cp config.test.json ./dist/config.test.json

sleep 10

NODE_ENV=test pm2 start npm --name test-app -- start

# Wait for the server to be online

printf 'Waiting for the server to come alive'

until $(curl --output /dev/null --silent --head --fail http://localhost:6000); do
    printf '.'
    sleep 5
done

echo "Server is alive"

sleep 20