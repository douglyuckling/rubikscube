import RubiksCubeFace from './RubiksCubeFace.js'
import RubiksCubeBlock from './RubiksCubeBlock.js'
import {loadRubiksCube} from './rubiksCubeModel.js';
import TurnQueue from './TurnQueue.js';

const facesDataByColor = {
    'red': {axis: 0, axisDirection: 1, adjacentFaces: ['white', 'blue', 'yellow', 'green']},
    'orange': {axis: 0, axisDirection: -1, adjacentFaces: ['white', 'green', 'yellow', 'blue']},
    'white': {axis: 1, axisDirection: 1, adjacentFaces: ['red', 'green', 'orange', 'blue']},
    'yellow': {axis: 1, axisDirection: -1, adjacentFaces: ['red', 'blue', 'orange', 'green']},
    'green': {axis: 2, axisDirection: 1, adjacentFaces: ['white', 'red', 'yellow', 'orange']},
    'blue': {axis: 2, axisDirection: -1, adjacentFaces: ['white', 'orange', 'yellow', 'red']},
};

const orientationsInClockwiseOrderByAxis = [
    ['front', 'top', 'back', 'bottom'],
    ['right', 'front', 'left', 'back'],
    ['top', 'right', 'bottom', 'left'],
];

export default class RubiksCube {

    constructor() {
        this.facesByColor = new Map();
        Object.keys(facesDataByColor).map(color => {
            const faceData = facesDataByColor[color];
            this.facesByColor.set(color, new RubiksCubeFace(color, faceData.axis, faceData.axisDirection));
        });

        this.facesByColor.forEach((face, color) => {
            face.setAdjacentFaces(facesDataByColor[color].adjacentFaces.map(it => this.facesByColor.get(it)));
        });

        const getBlockId = (colors) => {
            return colors.sort().join('_');
        };
        const edgeBlocksByColors = new Map();
        const getOrCreateEdgeBlockForColors = (stickerColors) => {
            const id = getBlockId(stickerColors);
            if (!edgeBlocksByColors.has(id)) {
                edgeBlocksByColors.set(id, new RubiksCubeBlock('edge', stickerColors));
            }
            return edgeBlocksByColors.get(id);
        };
        const cornerBlocksByColors = new Map();
        const getOrCreateCornerBlockForColors = (stickerColors) => {
            const id = getBlockId(stickerColors);
            if (!cornerBlocksByColors.has(id)) {
                cornerBlocksByColors.set(id, new RubiksCubeBlock('corner', stickerColors));
            }
            return cornerBlocksByColors.get(id);
        };

        this.facesByColor.forEach((face) => {
            const centerBlock = new RubiksCubeBlock('center', [face.color]);
            const edgeBlocks = [];
            const cornerBlocks = [];

            for (let i = 0; i < face.adjacentFaces.length; i++) {
                const adjacentFace = face.adjacentFaces[i];
                edgeBlocks.push(getOrCreateEdgeBlockForColors([face.color, adjacentFace.color]));

                const nextAdjacentFace = face.adjacentFaces[(i + 1) % face.adjacentFaces.length];
                cornerBlocks.push(getOrCreateCornerBlockForColors([face.color, adjacentFace.color, nextAdjacentFace.color]));
            }

            face.setBlocks([centerBlock].concat(edgeBlocks).concat(cornerBlocks));
        });

        this.faceColorsByOrientation = {
            right: 'red',
            left: 'orange',
            top: 'white',
            bottom: 'yellow',
            front: 'green',
            back: 'blue',
        };

        this.allBlocks = new Set();
        this.facesByColor.forEach(face => {
            face.blocks.forEach(block => {
                this.allBlocks.add(block);
            });
        });

        this._ready = false;
        this.turnQueue = new TurnQueue(this);
        this.initRubiksCubeBlocks();

        this.currentCubeAnimation = null;
    }

    initRubiksCubeBlocks() {
        return loadRubiksCube().then((rubiksCubeScene) => {
            this.rubiksCubeScene = rubiksCubeScene;

            // Would be more efficient to remove meshes from the list as we go.
            const blockMeshes = rubiksCubeScene.children;
            this.allBlocks.forEach(block => {
                const words = [block.type].concat(block.colors);
                const mesh = blockMeshes.find(blockMesh => {
                    return words.every(word => {
                        return blockMesh.name.includes(word);
                    });
                });
                block.setMesh(mesh);
            });

            this._ready = true;
        });
    }

    get ready() {
        return this._ready;
    }

    getFaceForOrientation(orientation) {
        const faceColor = this.faceColorsByOrientation[orientation];
        return this.facesByColor.get(faceColor);
    }

    update() {
        this.turnQueue.update();
        if (this.currentCubeAnimation) {
            this.currentCubeAnimation.update();
        }
    }

    isSolved() {
        return this.getIncorrectlyPositionedBlocks().length === 0;
    }

    getIncorrectlyPositionedBlocks() {
        return Array.from(this.allBlocks).filter(block => !block.isCorrectlyPositioned());
    }

    printState() {
        const incorrectlyPositionedBlocks = this.getIncorrectlyPositionedBlocks();
        if (incorrectlyPositionedBlocks.length === 0) {
            console.log("SOLVED!");
        } else {
            console.log(`${incorrectlyPositionedBlocks.length} incorrectly positioned blocks`);
        }
    }

    rotateLeft() {
        this.rotate(1, 1);
    }

    rotateRight() {
        this.rotate(1, -1);
    }

    rollLeft() {
        this.rotate(2, -1);
    }

    rollRight() {
        this.rotate(2, 1);
    }

    rotateUp() {
        this.rotate(0, 1);
    }

    rotateDown() {
        this.rotate(0, -1);
    }

    turnFace(orientation, numberOfClockwiseTurns) {
        this.turnQueue.enqueueTurnForFace(orientation, numberOfClockwiseTurns)
            .then(() => this.printState());
    }

    rotate(axis, numberOfClockwiseTurns) {
        this.turnQueue.enqueueTurnForCube(axis, numberOfClockwiseTurns)
    }

    rotateFaceColorsByOrientationToViewer(axis, numberOfClockwiseTurns) {
        const oldFaceColorsByOrientation = Object.assign({}, this.faceColorsByOrientation);
        const orientations = orientationsInClockwiseOrderByAxis[axis];
        orientations.forEach((orientation, i) => {
            const nextOrientation = orientations[normalizeArrayIndex(i - numberOfClockwiseTurns, orientations.length)];
            this.faceColorsByOrientation[orientation] = oldFaceColorsByOrientation[nextOrientation];
        });
    }

}

function normalizeArrayIndex(i, arrayLength) {
    i %= arrayLength;
    if (i < 0) {
        i += arrayLength;
    }
    return i;
}
