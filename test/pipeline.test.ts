import { describe, it, expect } from "vitest";
import { KiteZKReputationEngine } from "../src/engine.js";
import { BatchReputationPipeline } from "../src/pipeline.js";
import { AgentReputationProof, KITE_TESTNET_CONFIG } from "../src/types.js";

describe("BatchReputationPipeline", () => {
  it("processes heterogeneous batch of reputation proofs", async () => {
    const engine = new KiteZKReputationEngine(KITE_TESTNET_CONFIG, () => true);
    const pipeline = new BatchReputationPipeline(engine);

    const proofs: AgentReputationProof[] = [
      {
        agentId: "0x1111111111111111111111111111111111111111111111111111111111111111",
        reputationRoot: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        scoreTier: 3,
        computationEpoch: 1n,
        x402ReceiptHash: "0x2222222222222222222222222222222222222222222222222222222222222222",
        zkProof: "0x01",
      },
      {
        agentId: "0x3333333333333333333333333333333333333333333333333333333333333333",
        reputationRoot: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        scoreTier: 4,
        computationEpoch: 1n,
        x402ReceiptHash: "0x4444444444444444444444444444444444444444444444444444444444444444",
        zkProof: "0x02",
      },
    ];

    const res = await pipeline.processBatch({ proofs, strictEpochOrdering: true });
    expect(res.totalProcessed).toBe(2);
    expect(res.acceptedCount).toBe(2);
    expect(res.rejectedCount).toBe(0);
    expect(res.anchoredDigests).toHaveLength(2);
  });
});
