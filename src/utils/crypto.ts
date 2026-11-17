import { encodePacked, keccak256, type Hex } from "viem";

const DOMAIN_LEAF = keccak256(Buffer.from("KITE_REPUTATION_LEAF_V1", "utf-8"));
const DOMAIN_NODE = keccak256(Buffer.from("KITE_REPUTATION_NODE_V1", "utf-8"));

export function hashReputationLeaf(agentId: Hex, score: number, nonce: bigint): Hex {
  return keccak256(
    encodePacked(
      ["bytes32", "bytes32", "uint32", "uint64"],
      [DOMAIN_LEAF, agentId, score, nonce]
    )
  );
}

export function hashMerkleNodes(left: Hex, right: Hex): Hex {
  return keccak256(
    encodePacked(
      ["bytes32", "bytes32", "bytes32"],
      [DOMAIN_NODE, left, right]
    )
  );
}
