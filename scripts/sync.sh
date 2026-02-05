#!/bin/bash
# Sync script for CrossFit Open leaderboard data
# Processes pages until complete

JOB_ID=${1:-1}
BATCH_SIZE=${2:-50}
BASE_URL="http://localhost:3000"

echo "Starting sync for job ID: $JOB_ID"
echo "Processing in batches of $BATCH_SIZE pages"
echo ""

status="running"
page=0
total=0

while [ "$status" = "running" ]; do
  for i in $(seq 1 $BATCH_SIZE); do
    result=$(curl -s -X POST "$BASE_URL/api/sync/page" \
      -H "Content-Type: application/json" \
      -d "{\"jobId\": $JOB_ID}")

    status=$(echo "$result" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    page=$(echo "$result" | grep -o '"currentPage":[0-9]*' | cut -d':' -f2)
    total=$(echo "$result" | grep -o '"totalPages":[0-9]*' | cut -d':' -f2)

    if [ "$status" != "running" ]; then
      break
    fi
  done

  if [ -n "$page" ] && [ -n "$total" ]; then
    pct=$((page * 100 / total))
    echo "Progress: $page / $total pages ($pct%)"
  fi

  if [ "$status" = "completed" ]; then
    echo ""
    echo "Sync completed!"
    break
  fi

  if [ "$status" = "failed" ]; then
    echo ""
    echo "Sync failed!"
    echo "$result"
    exit 1
  fi

  # Small delay between batches
  sleep 0.5
done

echo ""
echo "Final status: $status"
