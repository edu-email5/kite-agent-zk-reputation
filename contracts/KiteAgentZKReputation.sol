// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

interface IZKScoreVerifier {
    function verifyProof(
        bytes calldata proof,
        uint256[4] calldata publicInputs
    ) external view returns (bool);
}

/**
 * @title KiteAgentZKReputation
 * @notice On-chain anchor registry for zero-knowledge autonomous agent reputation proofs on Kite Chain
 */
contract KiteAgentZKReputation {
    address public owner;
    address public zkVerifier;

    struct ReputationAnchor {
        bytes32 reputationRoot;
        uint8 scoreTier;
        uint64 epoch;
        bytes32 x402ReceiptHash;
        uint256 timestamp;
    }

    mapping(bytes32 => uint64) public latestEpochs;
    mapping(bytes32 => mapping(uint64 => ReputationAnchor)) public anchors;

    event ReputationAnchored(
        bytes32 indexed agentId,
        uint64 indexed epoch,
        uint8 scoreTier,
        bytes32 reputationRoot,
        bytes32 x402ReceiptHash,
        bytes32 attestationDigest
    );
    event VerifierUpdated(address indexed oldVerifier, address indexed newVerifier);

    error Unauthorized();
    error NonContractVerifier();
    error MonotonicEpochViolation(uint64 submittedEpoch, uint64 storedEpoch);
    error InvalidZKProof();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor(address _zkVerifier) {
        if (_zkVerifier.code.length == 0) revert NonContractVerifier();
        owner = msg.sender;
        zkVerifier = _zkVerifier;
    }

    function updateVerifier(address _newVerifier) external onlyOwner {
        if (_newVerifier.code.length == 0) revert NonContractVerifier();
        emit VerifierUpdated(zkVerifier, _newVerifier);
        zkVerifier = _newVerifier;
    }

    function anchorReputation(
        bytes32 agentId,
        bytes32 reputationRoot,
        uint8 scoreTier,
        uint64 epoch,
        bytes32 x402ReceiptHash,
        bytes calldata zkProof
    ) external returns (bytes32 attestationDigest) {
        uint64 currentEpoch = latestEpochs[agentId];
        if (epoch <= currentEpoch) {
            revert MonotonicEpochViolation(epoch, currentEpoch);
        }

        uint256[4] memory publicInputs = [
            uint256(agentId),
            uint256(reputationRoot),
            uint256(scoreTier),
            uint256(epoch)
        ];

        bool valid = IZKScoreVerifier(zkVerifier).verifyProof(zkProof, publicInputs);
        if (!valid) revert InvalidZKProof();

        latestEpochs[agentId] = epoch;
        anchors[agentId][epoch] = ReputationAnchor({
            reputationRoot: reputationRoot,
            scoreTier: scoreTier,
            epoch: epoch,
            x402ReceiptHash: x402ReceiptHash,
            timestamp: block.timestamp
        });

        attestationDigest = keccak256(
            abi.encodePacked(agentId, reputationRoot, scoreTier, uint256(epoch), x402ReceiptHash)
        );

        emit ReputationAnchored(
            agentId,
            epoch,
            scoreTier,
            reputationRoot,
            x402ReceiptHash,
            attestationDigest
        );
    }
}
