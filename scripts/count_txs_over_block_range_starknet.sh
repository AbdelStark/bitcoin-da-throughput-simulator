#!/bin/bash

set -euo pipefail

################################################################################
#                                  CONSTANTS                                     #
################################################################################

readonly MAX_RETRIES=3
readonly PROGRESS_UPDATE_BLOCKS=10

################################################################################
#                                  FUNCTIONS                                     #
################################################################################

print_usage() {
  echo "Usage: $0 <start_block> <end_block> [rpc_url]"
  echo
  echo "Count transactions over a block range on Starknet"
  echo
  echo "Arguments:"
  echo "  start_block    Starting block number"
  echo "  end_block      Ending block number"
  echo "  rpc_url        (Optional) RPC URL. Can also be set via STARKNET_RPC env var"
  exit 1
}

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

error() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
  exit 1
}

get_block_with_tx_hashes() {
  local block=$1
  block_data=$(curl -s -X POST "$rpc_url" \
    -H "Content-Type: application/json" \
    -d '{   
      "jsonrpc": "2.0",
      "method": "starknet_getBlockWithTxHashes",
      "params": {
        "block_id": {
          "block_number": '"$block"'
        }
      },
      "id": 1
    }')
  echo "$block_data"
}

count_txs_for_block() {
  local block=$1
  local retry=0
  
  while [[ $retry -lt $MAX_RETRIES ]]; do
    local response
    response=$(get_block_with_tx_hashes "$block")

    if [[ $? -eq 0 ]] && [[ -n "$response" ]]; then
      local tx_count
      tx_count=$(echo "$response" | jq -r '.result.transactions | length')
      if [[ $? -eq 0 ]] && [[ -n "$tx_count" ]]; then
        echo "$tx_count"
        return 0
      fi
    fi
    
    retry=$((retry + 1))
    log "Retry $retry/$MAX_RETRIES for block $block"
    sleep 1
  done
  
  error "Failed to get transaction count for block $block after $MAX_RETRIES retries"
}

################################################################################
#                              INPUT VALIDATION                                  #
################################################################################

# Validate input parameters
[[ $# -lt 2 ]] && print_usage

start_block=$1
end_block=$2

# Validate block numbers
[[ ! $start_block =~ ^[0-9]+$ ]] && error "Start block must be a number"
[[ ! $end_block =~ ^[0-9]+$ ]] && error "End block must be a number"
[[ $end_block -lt $start_block ]] && error "End block must be greater than start block"

# Set and validate RPC URL
if [[ -n "${3-}" ]]; then
  rpc_url=$3
elif [[ -n "${STARKNET_RPC-}" ]]; then
  rpc_url=$STARKNET_RPC
else
  error "RPC URL not provided and STARKNET_RPC env var not set"
fi

# Test RPC connection
curl -s "$rpc_url" > /dev/null || error "Could not connect to RPC endpoint: $rpc_url"

################################################################################
#                              INITIALIZATION                                    #
################################################################################

log "Starting transaction count from block $start_block to $end_block"
log "Using RPC URL: $rpc_url"

# Initialize counters and fetch block data
total_txs=0
current_block=$start_block
blocks_processed=0
total_blocks=$((end_block - start_block + 1))

# Get timestamp data
start_block_data=$(get_block_with_tx_hashes "$start_block")
end_block_data=$(get_block_with_tx_hashes "$end_block")

start_block_timestamp=$(echo "$start_block_data" | jq -r '.result.timestamp')
end_block_timestamp=$(echo "$end_block_data" | jq -r '.result.timestamp')
time_range=$((end_block_timestamp - start_block_timestamp))

################################################################################
#                              MAIN PROCESSING                                   #
################################################################################

while [[ $current_block -le $end_block ]]; do
  txs=$(count_txs_for_block "$current_block")
  total_txs=$((total_txs + txs))
  blocks_processed=$((blocks_processed + 1))
  
  # Progress update every PROGRESS_UPDATE_BLOCKS blocks or at the end
  if [[ $((blocks_processed % PROGRESS_UPDATE_BLOCKS)) -eq 0 ]] || [[ $current_block -eq $end_block ]]; then
    progress=$((blocks_processed * 100 / total_blocks))
    log "Progress: $progress% ($blocks_processed/$total_blocks blocks) - Current total: $total_txs txs"
  fi
  
  current_block=$((current_block + 1))
done

################################################################################
#                                 OUTPUT                                         #
################################################################################

log "Completed!"

# Human readable output
echo "----------------------------------------"
echo "SUMMARY"
echo "----------------------------------------"
echo "Total transactions: $total_txs"
echo "Time range: $time_range seconds"
echo "Transactions per second: $(echo "scale=2; $total_txs / $time_range" | bc)"
echo "----------------------------------------"

# Machine readable output (JSON)
echo "{\"total_txs\": $total_txs, \"time_range\": $time_range, \"tps\": $(echo "scale=2; $total_txs / $time_range" | bc)}"






