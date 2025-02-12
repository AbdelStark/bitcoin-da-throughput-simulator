# Flippy Flop Stress Test Campaign Scenario

Peak TPS Block on Starknet: <https://starkscan.co/block/855787>

Block number: `855787`
Timestamp: `1730243463` (30 October 2024 at 00:11:03 CET)
Transactions: `1449`

L1 State Update Transaction: <https://etherscan.io/tx/0x2863b4f81ee44c80fa46dae91007028d7f095f951279c4d0cf51625293eb118f>
Blob count: `3`
Block number: `855789`

Previous L1 State Update Transaction: <https://etherscan.io/tx/0x958534acce062554754e61e4c8451983d8d8e606a16882c6c0eecc39c2ff6aea>
Block number: `855777`


```bash
./scripts/count_txs_over_block_range_starknet.sh 855777 855789
```

```text
[2025-02-12 15:59:58] Starting transaction count from block 855777 to 855789
[2025-02-12 15:59:58] Using RPC URL: https://starknet-mainnet.blastapi.io/8b96893f-1f5f-4fb1-844f-642482149ecd/rpc/v0_6
[2025-02-12 16:00:04] Progress: 76% (10/13 blocks) - Current total: 10502 txs
[2025-02-12 16:00:05] Progress: 100% (13/13 blocks) - Current total: 13516 txs
[2025-02-12 16:00:05] Completed!
----------------------------------------
SUMMARY
----------------------------------------
Total transactions: 13516
Time range: 50 seconds
Transactions per second: 270.32
----------------------------------------
{"total_txs": 13516, "time_range": 50, "tps": 270.32}
```



