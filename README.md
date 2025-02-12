# Simulating Bitcoin as a Data Availability Layer for Starknet

## Introduction

**Data Availability (DA) in Starknet:** Starknet is a _Validity Rollup_ (ZK-rollup) that relies on an underlying Layer-1 blockchain to store critical data so that anyone can reconstruct the Layer-2 state. In Starknet's current design, after a batch of Layer-2 blocks is proven, the rollup posts a **state diff** (the compressed difference between the previous and new Starknet state) to Ethereum L1, along with a validity proof. This _data availability_ on Ethereum ensures that if Starknet ceased operation, others could retrieve the on-chain data (state diffs) and recover the full state of Starknet. Each Starknet state update can be posted as one or more data "blobs" on Ethereum.

**The problem – using Bitcoin for DA:** We want to estimate **Bitcoin's potential as an additional DA layer** for Starknet. The question is: if Starknet posted its state diffs to Bitcoin instead of Ethereum (a _one-to-one simulation of the current approach_), what throughput (TPS) could Starknet achieve, and how much data would be stored on Bitcoin?

We **extrapolate from real Starknet-on-Ethereum data** to project Bitcoin's capabilities as Starknet's DA layer. We will detail the methodology for extracting Starknet's L2 throughput and data usage from Ethereum, walk through an example calculation, then apply those findings to Bitcoin's parameters. Finally, we'll discuss the results, feasibility, and trade-offs of using Bitcoin for data availability.

## Methodology

**Overview:** To simulate Bitcoin as Starknet's data availability layer, we first gather metrics from Starknet's current operation on Ethereum. This involves measuring Starknet's **transaction throughput and data (state diff) usage** as recorded on Ethereum. The approach is to use Starknet mainnet data – specifically the L1 transactions that Starknet posts to Ethereum – to determine how many L2 transactions (or rather corresponding state diffs) are included per state update and how much data those updates contain. With these figures, we can compute Starknet's effective TPS and data per transaction. Then, by plugging in Bitcoin's block size and block time, we extrapolate what Starknet's TPS _would be_ if it used Bitcoin for the same data publishing, assuming a direct one-to-one usage of block space.

**Data extraction steps:**

1. **Identify consecutive Starknet state update transactions on Ethereum:** Each Starknet state update corresponds to an Ethereum L1 transaction (to Starknet's core contract) that finalizes a batch of L2 blocks. We find two successive state update events (call them update _N-1_ and _N_) in Ethereum's history. These mark the end of two consecutive Starknet batches.
2. **Note the timestamps or block numbers of these updates:** Using Ethereum block data, we record when update _N-1_ and _N_ were included on L1. The difference in timestamps gives the **time interval** over which Starknet accumulated transactions for that batch.
3. **Count the Starknet L2 transactions in the batch:** Starknet's state diff at update _N_ includes all the L2 transactions applied since the previous update. We retrieve the number of transactions processed in Starknet between _N-1_ and _N_. (This can be obtained from Starknet's L2 block explorer or by querying a Starknet RPC node.)
4. **Determine data usage on Ethereum:** For update _N_, we find out how much data was posted to Ethereum. If using calldata, this would be the calldata size (in bytes); if using blobs (as in recent Starknet versions), it's the number of blobs and their total size. Each blob is a fixed-size chunk of data (≈128 KB each in EIP-4844). We sum up all data bytes included in the state diff transaction(s) for that update.
5. **Calculate throughput and per-tx data:** Using the transaction count and time interval, we compute the average **transactions per second (TPS)** = (number of L2 transactions) / (interval in seconds). We also derive the **average data per transaction** = (total data bytes in state diff) / (number of transactions). This tells us, on average, how many bytes of L1 data each Starknet L2 transaction requires for DA (even if there is in reality no direct correlation between the L2 transactions and the L1 state diffs, and it's vastly dependent on the nature of the L2 transactions, i.e how much they touch the same storage slots, their complexity, etc.).
6. **Map to Bitcoin's parameters:** With the average data per transaction from Ethereum, we then apply Bitcoin's block constraints. We use Bitcoin's **block size (~4 MB) and block time (~600 s)** to compute how many Starknet transactions could fit into Bitcoin's blocks if _all_ block space were dedicated to Starknet state diffs. Essentially, we compute Bitcoin's data throughput (bytes per second) and divide by the data-per-tx to get an estimated TPS.
7. **General formula:** From this process, we can generalize a formula for any blockchain environment:

   \[
   \text{Max TPS}\_{\text{L2}} \approx \frac{\text{block size (bytes)}}{\text{block time (s)} \times \text{data per L2 tx (bytes)}}~,
   \]

   assuming the chain's entire block is used for L2 state diff data. We will provide this formula and show how it applies to Ethereum vs. Bitcoin.

Using this methodology on a specific example from Starknet's Ethereum mainnet data allows us to anchor our extrapolation in reality. Below, we detail an example state update and derive the key metrics needed for the Bitcoin simulation.

## 3. Example Calculation

To illustrate the above process, consider a **real Starknet state update** on Ethereum mainnet and the preceding update. We have the following data from Starknet's mainnet during a stress test campaign:

- **Previous state update (N-1):** Starknet state updated at _Starknet Block_ **855777** (recorded on Ethereum L1, [Etherscan link](https://etherscan.io/tx/0x958534acce062554754e61e4c8451983d8d8e606a16882c6c0eecc39c2ff6aea)).
- **Current state update (N):** Starknet state updated at _Starknet Block_ **855789** on L1 ([Etherscan link](https://etherscan.io/tx/0x2863b4f81ee44c80fa46dae91007028d7f095f951279c4d0cf51625293eb118f)).
- **L2 Transactions in this batch:** **13,516** transactions were processed on Starknet between blocks [855777](https://starkscan.co/block/855777) and [855789](https://starkscan.co/block/855789).
- **Time interval between blocks:** **50 seconds** elapsed between the blocks.
- **Data posted (state diff):** The Starknet state diff for update N was carried in **3 data blobs** on Ethereum, totaling **384 KB** of data (3 × 128 KB blobs). This is the information needed to reconstruct all 13,516 transactions' effects on Starknet's state.
- **Calculated throughput:** From the above, we compute the average TPS during this interval:
  \[
  \text{TPS} = \frac{13,516~\text{tx}}{50~\text{s}} \approx **270.32 \text{ transactions per second}**
  \]
  This represents a peak performance during a stress test, significantly higher than Starknet's typical mainnet throughput. But it does not matter for our extrapolation, as we are interested in the maximum possible throughput, not the typical one. Also, the max capacity of Starknet is higher than this, but again it's not that important here.
- **Data per transaction:** On average, each L2 transaction required about \[
  384~\text{KB} / 13,516 \approx 29~\text{bytes}
  \] of L1 data. In other words, for every Starknet transaction, roughly 29 bytes of state diff were posted to Ethereum.

From this example, we have two critical figures for our extrapolation:

1. **Throughput (TPS)** – Around 270 transactions per second.
2. **Data usage per transaction** – Approximately 29 bytes per transaction in the compressed state diff.

These values will serve as the baseline. Next, we will map these to Bitcoin's much different block constraints to estimate what would happen if Starknet used **Bitcoin as the DA layer** instead of Ethereum.

## 4. Extrapolation to Bitcoin

Now we apply the data from our Starknet-on-Ethereum example to Bitcoin's network parameters. **Bitcoin** has very different characteristics from Ethereum's chain:

- **Block size:** Bitcoin blocks have a _theoretical maximum size_ of about **4 MB** (4 million weight units, which corresponds to ~4 MB if filled with witness data). In practice, typical Bitcoin blocks are smaller (~1–2 MB), but for a theoretical maximum, we use 4 MB (as if we fill the entire block with Starknet data).
- **Block time:** Bitcoin produces a block roughly every **10 minutes (600 seconds)** on average.

**Maximum data throughput on Bitcoin:** Given a 4 MB block every 600 seconds, the maximum data availability throughput on Bitcoin is:
\[
\frac{4~\text{MB}}{600~\text{s}} = \frac{4 \times 1024 \times 1024~\text{bytes}}{600~\text{s}} \approx 6,830~\text{bytes per second}~,
\]
approximately _6.8 KB/s_ of data. In other terms, Bitcoin can include **4 MB of new data every 10 minutes** if blocks are full.

**Starknet on Bitcoin – TPS estimation:** We assume Starknet would use Bitcoin blocks purely to publish its state diffs (no other Bitcoin transactions, for a best-case scenario). Using the average data per transaction (~29 bytes from the example), we can estimate Starknet's TPS on Bitcoin:

- _Data per Starknet tx:_ ~29 bytes (from Ethereum measurement).
- _Data per second available on Bitcoin:_ ~6,830 bytes.
- _Transactions per second:_ \(6,830~\text{bytes/s} \div 29~\text{bytes/tx} \approx 235.5~\text{tx/s}\).

**Result:** **~235 transactions per second** could be supported in theory, if Bitcoin's every block were filled with Starknet state diff data. It's important to note this is a _theoretical maximum_. It assumes:

- Every Bitcoin block (4 MB) is completely utilized by Starknet data, which is of course not a realistic assumption.
- The average data per transaction remains similar (~29 bytes). As said earlier, it depends on the nature of the L2 transactions, their complexity, etc.
- There are no other limiting factors (like proof generation, sequencing, etc.).

**General extrapolation formula:** As mentioned, we can generalize the calculation. For any blockchain considered as a DA layer:

- Let **B** = block size (in bytes) available for data.
- Let **T** = block time (in seconds).
- Let **d** = average data (bytes) needed per L2 transaction (from compression of state diff).
- Then the maximum **TPS** ≈ \(\frac{B}{T \times d}\).

Using this formula:

- _Bitcoin:_ B ≈ 4,000,000 bytes, T = 600 s, d ≈ 29 bytes. TPS ≈ \( \frac{4\times10^6}{600 \times 29} \approx 235~\) tx/s, as calculated above.
