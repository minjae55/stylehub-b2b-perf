#!/bin/bash
TOKEN="$1"

if [ -z "$TOKEN" ]; then
  echo "사용법: bash chain_test.sh <accessToken>"
  exit 1
fi

test_depth() {
  LABEL=$1
  QUOTE_ID=$2

  cat > /tmp/chain_body.json << EOF
{"negotiationType":"QUOTE","quoteId":${QUOTE_ID},"content":"체인테스트 ${LABEL}","desiredUnitPrice":1000,"desiredLeadTimeDays":5}
EOF

  echo "===== ${LABEL} (quoteId=${QUOTE_ID}) ====="
  curl -s -w "\ntime: %{time_total}s / http_status: %{http_code}\n" \
    -X POST http://localhost:8080/api/negotiations \
    -H "Content-Type: application/json" \
    -H "Cookie: accessToken=${TOKEN}" \
    -d @/tmp/chain_body.json
  echo ""
}

test_depth "D1"  30106
test_depth "D5"  30111
test_depth "D10" 30121
test_depth "D20" 30141
test_depth "D50" 30191
