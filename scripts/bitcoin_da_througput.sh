#!/bin/bash

# Function to display usage
usage() {
    echo "Usage: $0 <blob_count> <total_transactions> <time_range> [bitcoin_block_size_mb]"
    echo "Example: $0 3 13516 50 1"
    exit 1
}

# Check if required parameters are provided
if [ "$#" -lt 3 ]; then
    usage
fi

# Input parameters
BLOB_COUNT=$1
TOTAL_TRANSACTIONS=$2
TIME_RANGE=$3
BITCOIN_BLOCK_SIZE_MB=${4:-1}  # Default to 1 MB if not provided

# Constants
BLOB_SIZE_KB=128
BYTES_PER_KB=1024
BITCOIN_BLOCK_TIME=600  # 10 minutes in seconds

# Calculate total data used in bytes
TOTAL_DATA_KB=$((BLOB_COUNT * BLOB_SIZE_KB))
TOTAL_DATA_BYTES=$((TOTAL_DATA_KB * BYTES_PER_KB))

# Calculate data per transaction in bytes
DATA_PER_TRANSACTION=$((TOTAL_DATA_BYTES / TOTAL_TRANSACTIONS))

# Calculate Bitcoin DA throughput
BITCOIN_BLOCK_SIZE_BYTES=$((BITCOIN_BLOCK_SIZE_MB * BYTES_PER_KB * BYTES_PER_KB))
BITCOIN_TPS=$(echo "scale=2; $BITCOIN_BLOCK_SIZE_BYTES / ($BITCOIN_BLOCK_TIME * $DATA_PER_TRANSACTION)" | bc)

# Calculate estimate scaling factor (assuming Bitcoin TPS of 7)
BITCOIN_L1_TPS=7
SCALING_FACTOR=$(echo "scale=2; $BITCOIN_TPS / $BITCOIN_L1_TPS" | bc)

# Output results
echo "----------------------------------------"
echo "INPUT PARAMETERS"
echo "----------------------------------------"
echo "Blob count: $BLOB_COUNT"
echo "Total transactions: $TOTAL_TRANSACTIONS"
echo "Time range: $TIME_RANGE seconds"
echo "Bitcoin block size: $BITCOIN_BLOCK_SIZE_MB MB"
echo "----------------------------------------"
echo "CALCULATED METRICS"
echo "----------------------------------------"
echo "Total data used: $TOTAL_DATA_KB KB"
echo "Data per transaction: $DATA_PER_TRANSACTION bytes/tx"
echo "Bitcoin DA throughput: $BITCOIN_TPS TPS"
echo "Scaling factor: $SCALING_FACTOR"
echo "----------------------------------------"