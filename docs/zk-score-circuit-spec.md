# ZK Score Circuit Constraints

## Public Inputs
1. `agentId` (bytes32)
2. `reputationRoot` (bytes32)
3. `scoreTier` (uint8)
4. `computationEpoch` (uint64)

## Private Witnesses
1. `rawScores` (uint32[16])
2. `taskIds` (bytes32[16])
3. `merkleSiblings` (bytes32[16][16])
