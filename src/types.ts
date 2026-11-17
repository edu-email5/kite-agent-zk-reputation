import { type Hex } from "viem";
import { z } from "zod";

export interface KiteNetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  reputationRegistryAddress?: Hex;
  zkVerifierAddress?: Hex;
}

export const KITE_TESTNET_CONFIG: KiteNetworkConfig = {
  chainId: 2368,
  name: "Kite Testnet",
  rpcUrl: "https://rpc-testnet.gokite.ai",
  reputationRegistryAddress: "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
  zkVerifierAddress: "0x4b7025e7ACD1542fc9F3845308609698066549A0",
};

export const KITE_MAINNET_CONFIG: KiteNetworkConfig = {
  chainId: 2366,
  name: "Kite Mainnet",
  rpcUrl: "https://rpc.gokite.ai",
};

export interface AgentReputationProof {
  agentId: Hex;
  reputationRoot: Hex;
  scoreTier: number; // Tier 1: Bronze (>=50), Tier 2: Silver (>=70), Tier 3: Gold (>=85), Tier 4: Platinum (>=95)
  computationEpoch: bigint;
  x402ReceiptHash: Hex;
  zkProof: Hex;
}

export const AgentReputationProofSchema = z.object({
  agentId: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  reputationRoot: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  scoreTier: z.number().int().min(1).max(4),
  computationEpoch: z.bigint().min(0n),
  x402ReceiptHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  zkProof: z.string().regex(/^0x[0-9a-fA-F]+$/),
});

export interface ReputationVerificationResult {
  valid: boolean;
  agentId: Hex;
  scoreTier: number;
  epoch: bigint;
  attestationDigest: Hex;
  rejectionReason?: string;
  verifiedAt: number;
}
