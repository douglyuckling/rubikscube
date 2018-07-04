export default class RubiksCubeFace {

    constructor(color, axis, axisDirection) {
        this.color = color;
        this.axis = axis;
        this.axisDirection = axisDirection;
        this.vector = createVectorFromAxisAndAxisDirection(axis, axisDirection)
    }

    setAdjacentFaces(adjacentFaces) {
        this.adjacentFaces = adjacentFaces;
    }

    setBlocks(blocks) {
        this.blocks = blocks;
    }

    turn(numberOfClockwiseTurns) {
        numberOfClockwiseTurns = normalizeNumberOfClockwiseTurns(numberOfClockwiseTurns);

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
            const newFace = this.adjacentFaces[normalizeNumberOfClockwiseTurns(i + numberOfClockwiseTurns)];
            const blocksFromOldFace = blocksSharedWithAdjacentFaceByAdjacentFace.get(oldFace);
            newFace.setBlocks(newFace.blocks.concat(blocksFromOldFace));
        });

        this.blocks.forEach((block) => {
            block.turn(this.axis, this.axisDirection * numberOfClockwiseTurns);
        });
    }

    toString() {
        return ``;
    }

}

function createVectorFromAxisAndAxisDirection(axis, axisDirection) {
    const vector = new THREE.Vector3(0, 0, 0);
    vector.setComponent(axis, Math.sign(axisDirection));
    return vector;
}

function normalizeNumberOfClockwiseTurns(n) {
    n %= 4;
    if (n < 0) {
        n += 4;
    }
    return n % 4;
}
