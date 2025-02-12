# Simulating Bitcoin as a Data Availability Layer for Starknet

## Introduction

**Data Availability (DA) in Starknet:** Starknet is a _Validity Rollup_ (ZK-rollup) that relies on an underlying Layer-1 blockchain to store critical data so that anyone can reconstruct the Layer-2 state. In Starknet's current design, after a batch of Layer-2 blocks is proven, the rollup posts a **state diff** (the compressed difference between the previous and new Starknet state) to Ethereum L1, along with a validity proof. This _data availability_ on Ethereum ensures that if Starknet ceased operation, others could retrieve the on-chain data (state diffs) and recover the full state of Starknet. Each Starknet state update can be posted as one or more data "blobs" on Ethereum.

**The problem – using Bitcoin for DA:** We want to estimate **Bitcoin's potential as an additional DA layer** for Starknet. The question is: if Starknet posted its state diffs to Bitcoin instead of Ethereum (a _one-to-one simulation of the current approach_), what throughput (TPS) could Starknet achieve, and how much data would be stored on Bitcoin?

We **extrapolate from real Starknet-on-Ethereum data** to project Bitcoin's capabilities as Starknet's DA layer. We will detail the methodology for extracting Starknet's L2 throughput and data usage from Ethereum, walk through an example calculation, then apply those findings to Bitcoin's parameters. Finally, we'll discuss the results, feasibility, and trade-offs of using Bitcoin for data availability.

---

## Methodology

### Overview

To simulate Bitcoin as Starknet's data availability layer, we first gather metrics from Starknet's current operation on Ethereum. This involves measuring Starknet's **transaction throughput and data (state diff) usage** as recorded on Ethereum. The approach is to use Starknet mainnet data – specifically the L1 transactions that Starknet posts to Ethereum – to determine how many L2 transactions (or rather corresponding state diffs) are included per state update and how much data those updates contain. With these figures, we can compute Starknet's effective TPS and data per transaction. Then, by plugging in Bitcoin's block size and block time, we extrapolate what Starknet's TPS _would be_ if it used Bitcoin for the same data publishing, assuming a direct one-to-one usage of block space.

### Data extraction steps

1. **Identify consecutive Starknet state update transactions on Ethereum:**  
   Each Starknet state update corresponds to an Ethereum L1 transaction (to Starknet's core contract) that finalizes a batch of L2 blocks. We find two successive state update events (call them update _N-1_ and _N_) in Ethereum's history. These mark the end of two consecutive Starknet batches.

2. **Note the timestamps or block numbers of these updates:**  
   Using Ethereum block data, we record when update _N-1_ and _N_ were included on L1. The difference in timestamps gives the **time interval** over which Starknet accumulated transactions for that batch.

3. **Count the Starknet L2 transactions in the batch:**  
   Starknet's state diff at update _N_ includes all the L2 transactions applied since the previous update. We retrieve the number of transactions processed in Starknet between _N-1_ and _N_. (This can be obtained from Starknet's L2 block explorer or by querying a Starknet RPC node.)

4. **Determine data usage on Ethereum:**  
   For update _N_, we find out how much data was posted to Ethereum. If using calldata, this would be the calldata size (in bytes); if using blobs (as in recent Starknet versions), it's the number of blobs and their total size. Each blob is a fixed-size chunk of data (≈128 KB each in EIP-4844). We sum up all data bytes included in the state diff transaction(s) for that update.

5. **Calculate throughput and per-tx data:**  
   Using the transaction count and time interval, we compute the average **transactions per second (TPS)**:

   ```text
   TPS = (number of L2 transactions) / (interval in seconds)
   ```

   We also derive the **average data per transaction**:

   ```text
   data_per_tx = (total data bytes in state diff) / (number of transactions)
   ```

   This tells us, on average, how many bytes of L1 data each Starknet L2 transaction requires for DA (even if there is in reality no direct correlation between the L2 transactions and the L1 state diffs, as it depends on how many storage slots were touched, etc.).

6. **Map to Bitcoin's parameters:**  
   With the average data per transaction from Ethereum, we then apply Bitcoin's block constraints. We use Bitcoin's **block size (~4 MB) and block time (~600 s)** to compute how many Starknet transactions could fit into Bitcoin's blocks if _all_ block space were dedicated to Starknet state diffs. Essentially, we compute Bitcoin's data throughput (bytes per second) and divide by the data-per-tx to get an estimated TPS.

7. **General formula:**  
   We can generalize a formula for any blockchain environment:

   ```text
   TPS_L2 = B / (T * d)
   ```

   where:

   - `B` = block size (in bytes) available for data
   - `T` = block time (in seconds)
   - `d` = average data (bytes) needed per L2 transaction (from compression of state diff)

   This formula assumes the chain's entire block is used for L2 state diff data.

---

## Example Calculation

To illustrate the above process, consider a **real Starknet state update** on Ethereum mainnet and the preceding update. We have the following data from Starknet's mainnet during a stress test campaign:

- **Previous state update (N-1):** Starknet state updated at _Starknet Block_ **855777** on Ethereum L1.  
  [Etherscan link](https://etherscan.io/tx/0x958534acce062554754e61e4c8451983d8d8e606a16882c6c0eecc39c2ff6aea)

- **Current state update (N):** Starknet state updated at _Starknet Block_ **855789** on L1.  
  [Etherscan link](https://etherscan.io/tx/0x2863b4f81ee44c80fa46dae91007028d7f095f951279c4d0cf51625293eb118f)

- **L2 Transactions in this batch:**  
  **13,516** transactions were processed on Starknet between blocks [855777](https://starkscan.co/block/855777) and [855789](https://starkscan.co/block/855789).

- **Time interval between blocks:**  
  **50 seconds** elapsed between the blocks.

- **Data posted (state diff):**  
  The Starknet state diff for update N was carried in **3 data blobs** on Ethereum, totaling **384 KB** of data (3 × 128 KB blobs). This data is required to reconstruct all 13,516 transactions' effects on Starknet's state.

- **Calculated throughput:**

  ```text
  TPS = 13,516 tx / 50 s = 270.32 tx/s
  ```

  This represents a peak performance during a stress test. (The typical mainnet throughput is lower, but we use this example for demonstration.)

- **Data per transaction:**

  ```text
  data_per_tx = 384 KB / 13,516 ≈ 29 bytes per tx
  ```

Thus, on average, each L2 transaction required ~29 bytes of L1 data.

---

## Extrapolation to Bitcoin

Now we apply the data from our Starknet-on-Ethereum example to **Bitcoin**’s network parameters, which differ significantly:

- **Block size:** A theoretical maximum of ~4 MB (4 million weight units).
- **Block time:** Roughly 600 seconds (10 minutes) per block.

### Maximum Data Throughput on Bitcoin

If each block is used **solely** for Starknet state diffs, we have:

```text
4 MB block / 600 s = (4 × 1,024 × 1,024) bytes / 600 s ≈ 6,830 bytes/s
```

So approximately **6.8 KB/s** of data can be posted on Bitcoin in that ideal scenario.

### Starknet on Bitcoin – TPS Estimation

Using our measured average of 29 bytes per L2 transaction:

```text
data_per_second = 6,830 bytes/s
data_per_tx = 29 bytes/tx
TPS_L2 = data_per_second / data_per_tx
       = 6,830 / 29
       ≈ 235.5 tx/s
```

Hence, **~235 transactions per second** could be supported in theory, **if**:

- Every Bitcoin block (4 MB) is completely filled with Starknet data.
- The average data per transaction stays at ~29 bytes.
- Other constraints like proof generation and actual network usage are ignored.

### General Extrapolation Formula

As discussed, the general formula for any chain is:

```text
TPS_L2 = B / (T * d)
```

where:

- `B` = block size (in bytes) available for data
- `T` = block time (in seconds)
- `d` = data per L2 transaction (in bytes)

---

## Conclusion

Using **Bitcoin** as a data availability layer for Starknet, under these assumptions, yields a theoretical maximum of around **235 transactions per second**. This is based on:

- A peak measurement of **29 bytes** per L2 transaction on Ethereum,
- A **4 MB** block size on Bitcoin,
- A **10-minute** block time.

In reality, there are many practical limitations and unrealistic assumptions that we made here. Still, this exercise shows how to **extrapolate** from Ethereum’s observed data usage to Bitcoin’s different properties as a DA layer.
