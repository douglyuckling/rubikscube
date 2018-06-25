export default class RubiksCubeFace {

    constructor(color, vector) {
        this.color = color;
        this.vector = vector;
    }

    setAdjacentFaces(adjacentFaces) {
        this.adjacentFaces = adjacentFaces;
    }

    setBlocks(blocks) {
        this.blocks = blocks;
    }

    turn(numberOfClockwiseTurns) {
        while (numberOfClockwiseTurns < 0) {
            numberOfClockwiseTurns += this.adjacentFaces.length;
        }

        const blocksSharedWithAdjacentFaceByAdjacentFace = new Map();
        this.adjacentFaces.forEach((adjacentFace) => {
            const blocksSharedWithAdjacentFace = [];
            adjacentFace.setBlocks(adjacentFace.blocks.filter(block => {
                if (this.blocks.includes(block)) {
                    blocksSharedWithAdjacentFace.push(block);
                    return false;
                }
                return true;
            }));
            blocksSharedWithAdjacentFaceByAdjacentFace.set(adjacentFace, blocksSharedWithAdjacentFace);
        });

        this.adjacentFaces.forEach((oldFace, i) => {
            const newFace = this.adjacentFaces[(i + numberOfClockwiseTurns) % this.adjacentFaces.length];
            const blocksFromOldFace = blocksSharedWithAdjacentFaceByAdjacentFace.get(oldFace);
            newFace.setBlocks(newFace.blocks.concat(blocksFromOldFace));
        });
    }

    toString() {
        return ``;
    }

}
