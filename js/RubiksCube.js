import RubiksCubeFace from './RubiksCubeFace.js'
import RubiksCubeBlock from './RubiksCubeBlock.js'
import {loadRubiksCube} from './rubiksCubeModel.js';
import TurnQueue from './TurnQueue.js';
import RubiksCubeAnimation from './RubiksCubeAnimation.js'

const facesDataByColor = {
    'red': {axis: 0, axisDirection: 1, adjacentFaces: ['white', 'blue', 'yellow', 'green']},
    'orange': {axis: 0, axisDirection: -1, adjacentFaces: ['white', 'green', 'yellow', 'blue']},
    'white': {axis: 1, axisDirection: 1, adjacentFaces: ['red', 'green', 'orange', 'blue']},
    'yellow': {axis: 1, axisDirection: -1, adjacentFaces: ['red', 'blue', 'orange', 'green']},
    'blue': {axis: 2, axisDirection: -1, adjacentFaces: ['white', 'orange', 'yellow', 'red']},
    'green': {axis: 2, axisDirection: 1, adjacentFaces: ['white', 'red', 'yellow', 'orange']},
};

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

        this.allBlocks = new Set();
        this.facesByColor.forEach(face => {
            face.blocks.forEach(block => {
                this.allBlocks.add(block);
            });
        });

        this._ready = false;
        this.turnQueue = new TurnQueue();
        this.initRubiksCubeBlocks()
            .then(() => {
                this.printState();

                const enqueueSomeTurns = () => {
                    this.turnQueue.enqueueTurnForFace(this.facesByColor.get('red'), 2).then(() => this.printState());
                    this.turnQueue.enqueueTurnForFace(this.facesByColor.get('orange'), 2).then(() => this.printState());
                    this.turnQueue.enqueueTurnForFace(this.facesByColor.get('white'), 2).then(() => this.printState());
                    this.turnQueue.enqueueTurnForFace(this.facesByColor.get('yellow'), 2).then(() => this.printState());
                    this.turnQueue.enqueueTurnForFace(this.facesByColor.get('green'), 2).then(() => this.printState());
                    this.turnQueue.enqueueTurnForFace(this.facesByColor.get('blue'), 2).then(() => this.printState())
                        .then(() => {
                            window.setTimeout(enqueueSomeTurns, 2000);
                        });
                };

                enqueueSomeTurns();
            });

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

    rotateUp() {
        this.rotate(0, 1);
    }

    rotateDown() {
        this.rotate(0, -1);
    }

    rotate(axis, numberOfClockwiseTurns) {
        if (!this.currentCubeAnimation && this.rubiksCubeScene) {
            const axisOfRotation = new THREE.Vector3(0, 0, 0);
            axisOfRotation.setComponent(axis, 1);

            this.currentCubeAnimation = new RubiksCubeAnimation(this.rubiksCubeScene, axisOfRotation, numberOfClockwiseTurns);
            this.currentCubeAnimation.promise.then(() => {
                this.currentCubeAnimation = null;
            });
        }
    }

}
