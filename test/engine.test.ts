import { describe, it, expect } from "vitest";
import { KiteZKReputationEngine } from "../src/engine.js";
import { AgentReputationProof, KITE_TESTNET_CONFIG } from "../src/types.js";

describe("KiteZKReputationEngine", () => {
  it("accepts valid proofs and advances monotonic epoch", async () => {
    const engine = new KiteZKReputationEngine(KITE_TESTNET_CONFIG, () => true);

    const proof: AgentReputationProof = {
      agentId: "0x1111111111111111111111111111111111111111111111111111111111111111",
      reputationRoot: "0x2222222222222222222222222222222222222222222222222222222222222222",
      scoreTier: 3,
      computationEpoch: 1n,
      x402ReceiptHash: "0x3333333333333333333333333333333333333333333333333333333333333333",
      zkProof: "0xabcdef123456",
    };

    const res1 = await engine.verifyReputationProof(proof);
    expect(res1.valid).toBe(true);
    expect(res1.epoch).toBe(1n);

    // Reject replay epoch 1
    const res2 = await engine.verifyReputationProof(proof);
    expect(res2.valid).toBe(false);
    expect(res2.rejectionReason).toContain("Epoch rollback or replay detected");

    // Accept forward epoch 2
    const res3 = await engine.verifyReputationProof({ ...proof, computationEpoch: 2n });
    expect(res3.valid).toBe(true);
  });

  it("fails verification when verifier callback rejects", async () => {
    const engine = new KiteZKReputationEngine(KITE_TESTNET_CONFIG, () => false);
    const proof: AgentReputationProof = {
      agentId: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      reputationRoot: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      scoreTier: 2,
      computationEpoch: 5n,
      x402ReceiptHash: "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
      zkProof: "0x9999",
    };

    const res = await engine.verifyReputationProof(proof);
    expect(res.valid).toBe(false);
    expect(res.rejectionReason).toContain("Groth16 ZK proof verification failed");
  });
});
