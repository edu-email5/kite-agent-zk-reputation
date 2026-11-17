import { type Hex } from "viem";
import { hashMerkleNodes } from "./utils/crypto.js";

export class ReputationMerkleTree {
  private leaves: Hex[];
  private layers: Hex[][];

  constructor(leaves: Hex[]) {
    if (leaves.length === 0) {
      throw new Error("Cannot construct empty Merkle tree");
    }
    this.leaves = [...leaves];
    this.layers = [this.leaves];
    this.buildTree();
  }

  private buildTree(): void {
    let currentLayer = this.leaves;
    while (currentLayer.length > 1) {
      const nextLayer: Hex[] = [];
      for (let i = 0; i < currentLayer.length; i += 2) {
        if (i + 1 < currentLayer.length) {
          nextLayer.push(hashMerkleNodes(currentLayer[i], currentLayer[i + 1]));
        } else {
          // Odd leaf promotion with self-pairing
          nextLayer.push(hashMerkleNodes(currentLayer[i], currentLayer[i]));
        }
      }
      this.layers.push(nextLayer);
      currentLayer = nextLayer;
    }
  }

  public getRoot(): Hex {
    return this.layers[this.layers.length - 1][0];
  }

  public getProof(index: number): Hex[] {
    if (index < 0 || index >= this.leaves.length) {
      throw new Error("Index out of bounds");
    }
    const proof: Hex[] = [];
    let layerIndex = index;
    for (let l = 0; l < this.layers.length - 1; l++) {
      const currentLayer = this.layers[l];
      const isRight = layerIndex % 2 === 1;
      const siblingIndex = isRight ? layerIndex - 1 : layerIndex + 1;
      if (siblingIndex < currentLayer.length) {
        proof.push(currentLayer[siblingIndex]);
      } else {
        proof.push(currentLayer[layerIndex]);
      }
      layerIndex = Math.floor(layerIndex / 2);
    }
    return proof;
  }

  public static verifyProof(leaf: Hex, proof: Hex[], root: Hex, index: number): boolean {
    let current = leaf;
    let idx = index;
    for (const sibling of proof) {
      const isRight = idx % 2 === 1;
      current = isRight ? hashMerkleNodes(sibling, current) : hashMerkleNodes(current, sibling);
      idx = Math.floor(idx / 2);
    }
    return current.toLowerCase() === root.toLowerCase();
  }
}
