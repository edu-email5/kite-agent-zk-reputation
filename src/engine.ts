import { encodePacked, keccak256, type Hex } from "viem";
import {
  AgentReputationProof,
  AgentReputationProofSchema,
  KiteNetworkConfig,
  KITE_TESTNET_CONFIG,
  ReputationVerificationResult
} from "./types.js";

export type ZKScoreProofVerifier = (
  proof: AgentReputationProof,
  publicInputs: readonly [Hex, Hex, bigint, bigint]
) => boolean | Promise<boolean>;

export class KiteZKReputationEngine {
  private config: KiteNetworkConfig;
  private knownEpochs: Map<string, bigint> = new Map();

  constructor(
    config: KiteNetworkConfig = KITE_TESTNET_CONFIG,
    private readonly verifyScoreProof?: ZKScoreProofVerifier
  ) {
    this.config = config;
  }

  public computeAttestationDigest(proof: AgentReputationProof): Hex {
    return keccak256(
      encodePacked(
        ["bytes32", "bytes32", "uint8", "uint256", "bytes32"],
        [
          proof.agentId,
          proof.reputationRoot,
          proof.scoreTier,
          proof.computationEpoch,
          proof.x402ReceiptHash,
        ]
      )
    );
  }

  public async verifyReputationProof(
    proof: AgentReputationProof
  ): Promise<ReputationVerificationResult> {
    const parseResult = AgentReputationProofSchema.safeParse(proof);
    if (!parseResult.success) {
      return {
        valid: false,
        agentId: proof.agentId,
        scoreTier: proof.scoreTier,
        epoch: proof.computationEpoch,
        attestationDigest: "0x00" as Hex,
        rejectionReason: `Schema validation failed: ${parseResult.error.message}`,
        verifiedAt: Date.now(),
      };
    }

    const agentKey = proof.agentId.toLowerCase();
    const lastEpoch = this.knownEpochs.get(agentKey) ?? -1n;
    if (proof.computationEpoch <= lastEpoch) {
      return {
        valid: false,
        agentId: proof.agentId,
        scoreTier: proof.scoreTier,
        epoch: proof.computationEpoch,
        attestationDigest: "0x00" as Hex,
        rejectionReason: `Epoch rollback or replay detected: proof epoch ${proof.computationEpoch} <= stored epoch ${lastEpoch}`,
        verifiedAt: Date.now(),
      };
    }

    const digest = this.computeAttestationDigest(proof);

    // Cryptographic verification if prover hook injected
    if (this.verifyScoreProof) {
      const publicInputs = [
        proof.agentId,
        proof.reputationRoot,
        BigInt(proof.scoreTier),
        proof.computationEpoch,
      ] as const;

      try {
        const zkValid = await this.verifyScoreProof(proof, publicInputs);
        if (!zkValid) {
          return {
            valid: false,
            agentId: proof.agentId,
            scoreTier: proof.scoreTier,
            epoch: proof.computationEpoch,
            attestationDigest: digest,
            rejectionReason: "Groth16 ZK proof verification failed against verifier key",
            verifiedAt: Date.now(),
          };
        }
      } catch (err) {
        return {
          valid: false,
          agentId: proof.agentId,
          scoreTier: proof.scoreTier,
          epoch: proof.computationEpoch,
          attestationDigest: digest,
          rejectionReason: `Verifier execution error: ${err instanceof Error ? err.message : String(err)}`,
          verifiedAt: Date.now(),
        };
      }
    }

    // Advance stateful monotonic epoch
    this.knownEpochs.set(agentKey, proof.computationEpoch);

    return {
      valid: true,
      agentId: proof.agentId,
      scoreTier: proof.scoreTier,
      epoch: proof.computationEpoch,
      attestationDigest: digest,
      verifiedAt: Date.now(),
    };
  }

  public getLatestEpoch(agentId: Hex): bigint {
    return this.knownEpochs.get(agentId.toLowerCase()) ?? 0n;
  }
}
