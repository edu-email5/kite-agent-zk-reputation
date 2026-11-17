import { describe, it, expect } from "vitest";
import { hashReputationLeaf } from "../src/utils/crypto.js";
import { ReputationMerkleTree } from "../src/merkle-tree.js";

describe("ReputationMerkleTree", () => {
  it("builds a valid Merkle tree and verifies membership proofs", () => {
    const leaf1 = hashReputationLeaf("0x1111111111111111111111111111111111111111111111111111111111111111", 95, 1n);
    const leaf2 = hashReputationLeaf("0x2222222222222222222222222222222222222222222222222222222222222222", 88, 1n);
    const leaf3 = hashReputationLeaf("0x3333333333333333333333333333333333333333333333333333333333333333", 72, 1n);

    const tree = new ReputationMerkleTree([leaf1, leaf2, leaf3]);
    const root = tree.getRoot();

    expect(root).toMatch(/^0x[0-9a-f]{64}$/);

    const proof0 = tree.getProof(0);
    expect(ReputationMerkleTree.verifyProof(leaf1, proof0, root, 0)).toBe(true);

    const proof1 = tree.getProof(1);
    expect(ReputationMerkleTree.verifyProof(leaf2, proof1, root, 1)).toBe(true);

    const proof2 = tree.getProof(2);
    expect(ReputationMerkleTree.verifyProof(leaf3, proof2, root, 2)).toBe(true);

    // Tampered leaf should fail
    expect(ReputationMerkleTree.verifyProof(leaf2, proof0, root, 0)).toBe(false);
  });
});
