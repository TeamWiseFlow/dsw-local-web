# curl command to call /find with post data of keyword
curl -H "Content-Type: application/json" \
    -X POST \
    http://localhost:3001/find \
    -d '{
        "keyword":"2023"
        }'

echo

curl -H "Content-Type: application/json" \
    -X POST \
    http://localhost:3001/find \
    -d '{
        "keyword":"2022"
        }'

echo

curl -H "Content-Type: application/json" \
    -X POST \
    http://localhost:3001/find \
    -d '{
        "keyword":"*"
        }'

echo