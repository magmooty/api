TOKEN="5430560216:AAFHiS7yV50Fsq4Fjr8g95q2OTDlCFvrqbY" 
ID="-1001715042430"
URL="https://api.telegram.org/bot$TOKEN/sendMessage"

BRANCH=$(cat config.json | grep "\"env\":" | sed 's/  "env": "//' | sed 's/",//')
VERSION=$(cat package.json | grep "\"version\":" | sed 's/  "version": "//' | sed 's/",//')

curl -s -X POST $URL -d chat_id=$ID -d text="Build has finished for Magmooty on ${BRANCH} version ${VERSION}"