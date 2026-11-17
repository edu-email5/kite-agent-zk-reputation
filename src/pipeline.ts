import { KiteZKReputationEngine } from "./engine.js";
import { AgentReputationProof } from "./types.js";
import { type Hex } from "viem";

export interface BatchReputationRequest {
  proofs: AgentReputationProof[];
  strictEpochOrdering?: boolean;
  stopOnFirstRejection?: boolean;
}

export interface BatchReputationSummary {
  totalProcessed: number;
  acceptedCount: number;
  rejectedCount: number;
  anchoredDigests: Hex[];
  rejections: Array<{
    agentId: Hex;
    epoch: bigint;
    reason: string;
  }>;
}

export class BatchReputationPipeline {
  constructor(private readonly engine: KiteZKReputationEngine) {}

  public async processBatch(request: BatchReputationRequest): Promise<BatchReputationSummary> {
    const summary: BatchReputationSummary = {
      totalProcessed: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      anchoredDigests: [],
      rejections: [],
    };

    const batchSeenEpochs = new Map<string, bigint>();

    for (const proof of request.proofs) {
      summary.totalProcessed++;

      if (request.strictEpochOrdering) {
        const lastSeen = batchSeenEpochs.get(proof.agentId.toLowerCase());
        if (lastSeen !== undefined && proof.computationEpoch <= lastSeen) {
          summary.rejectedCount++;
          summary.rejections.push({
            agentId: proof.agentId,
            epoch: proof.computationEpoch,
            reason: `Strict ordering violation: epoch ${proof.computationEpoch} <= ${lastSeen}`,
          });
          if (request.stopOnFirstRejection) break;
          continue;
        }
      }

      const res = await this.engine.verifyReputationProof(proof);
      if (res.valid) {
        summary.acceptedCount++;
        summary.anchoredDigests.push(res.attestationDigest);
        batchSeenEpochs.set(proof.agentId.toLowerCase(), proof.computationEpoch);
      } else {
        summary.rejectedCount++;
        summary.rejections.push({
          agentId: res.agentId,
          epoch: res.epoch,
          reason: res.rejectionReason ?? "Unknown validation failure",
        });
        if (request.stopOnFirstRejection) break;
      }
    }

    return summary;
  }
}
