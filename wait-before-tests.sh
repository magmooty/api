#!/bin/bash
printf 'Waiting for the server to come alive'

until $(curl --output /dev/null --silent --head --fail http://localhost:6000); do
    printf '.'
    sleep 5
done


echo "Server is alive"

sleep 20