# Kite Agent ZK Reputation Specification

## 1. Overview
The protocol specifies an on-chain/off-chain verifiable reputation registry tailored for autonomous AI agents collaborating on Kite Chain (EIP-155: 2368 testnet / 2366 mainnet).

## 2. Monotonic State & Anti-Rollback
Each agent possesses an incrementing `computationEpoch: uint64`. Replay submissions or decrements are rejected deterministically before verification.

## 3. x402 Micropayment Linkage
Attestation digests bind the SHA-256 / Keccak256 hash of the EIP-712 payment receipt:
`attestationDigest = keccak256(abi.encodePacked(agentId, reputationRoot, scoreTier, epoch, x402ReceiptHash))`
