# Starknet Blob Usage on Ethereum

Starknet Core contract address: `0xc662c410C0ECf747543f5bA90660f6ABeBD9C8c4`

Get update state transactions: <https://etherscan.io/address/0xc662c410c0ecf747543f5ba90660f6abebd9c8c4>

## Methodology:

- Get an update state transaction
- Get the blob count (e.g 6), retrieve the block number in the `LogStateUpdate` event
- Get the block number of the previous update state transaction
- You know have the range of blocks corresponding to this update state
- Total number of data for this update state is blob count * 128kb
- Query the Starknet blocks to count the total number of transactions in this range
- Compute the difference between the timestamp of the block number of the current update state and the previous update state
- Compute the total number of transactions divided by the time range to get the transactions per second over the period
- You can then map a TPS to the total number of data for this update state

To translate this to what TPS we could get on Bitcoin, we can proceed as follows:

- Get the max data that can be stored in a Bitcoin block

## Example

Update state N: <https://etherscan.io/tx/0x10a601c06bfe00f8c0bef451ba917bc98822182d9ab6d148045bb9551089ef79>
`blockNumber` in `LogStateUpdate` event: `1145357` (in hexa: `0x117A0D`)

Update state N-1: <https://etherscan.io/tx/0x873d6d8fe44f409f0691f9eb00e257ff0d80837e9660bb34b816ce6e8921b136>
`blockNumber` in `LogStateUpdate` event: `1144907`

We can then fetch transactions over the range of blocks:

```bash
./scripts/count_txs_over_block_range_starknet.sh 1144907 1145357
```

```text
Total transactions: 7794
Time range: 14797 seconds
Transactions per second: 0.52
```

Blob count: `5`

Total data: `5 * 128kb = 640kb`
TPS: `0.52`
