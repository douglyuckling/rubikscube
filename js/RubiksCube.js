import RubiksCubeFace from './RubiksCubeFace.js'
import RubiksCubeBlock from './RubiksCubeBlock.js'
import {loadRubiksCube} from './rubiksCubeModel.js';
import TurnQueue from './TurnQueue.js';

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

        this._ready = false;
        this.turnQueue = new TurnQueue();
        this.initRubiksCubeBlocks()
            .then(() => {
                const enqueueSomeTurns = () => {
                    this.turnQueue.enqueueTurnForFace(this.facesByColor.get('red'), 2);
                    this.turnQueue.enqueueTurnForFace(this.facesByColor.get('orange'), 2);
                    this.turnQueue.enqueueTurnForFace(this.facesByColor.get('white'), 2);
                    this.turnQueue.enqueueTurnForFace(this.facesByColor.get('yellow'), 2);
                    this.turnQueue.enqueueTurnForFace(this.facesByColor.get('green'), 2);
                    this.turnQueue.enqueueTurnForFace(this.facesByColor.get('blue'), 2)
                        .then(() => {
                            window.setTimeout(enqueueSomeTurns, 2000);
                        });
                };

                enqueueSomeTurns();
            });
    }

    initRubiksCubeBlocks() {
        return loadRubiksCube().then((rubiksCubeScene) => {
            const allBlocks = new Set();

            this.facesByColor.forEach(face => {
                face.blocks.forEach(block => {
                    allBlocks.add(block);
                });
            });

            // Would be more efficient to remove meshes from the list as we go.
            const blockMeshes = rubiksCubeScene.children;
            allBlocks.forEach(block => {
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
    }

}
