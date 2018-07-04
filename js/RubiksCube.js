import RubiksCubeFace from './RubiksCubeFace.js'
import RubiksCubeBlock from './RubiksCubeBlock.js'
import {loadRubiksCube} from './rubiksCubeModel.js';
import TurnQueue from './TurnQueue.js';

const facesDataByColor = {
    'red': {vector: new THREE.Vector3(1, 0, 0), adjacentFaces: ['white', 'blue', 'yellow', 'green']},
    'orange': {vector: new THREE.Vector3(-1, 0, 0), adjacentFaces: ['white', 'green', 'yellow', 'blue']},
    'white': {vector: new THREE.Vector3(0, 1, 0), adjacentFaces: ['red', 'green', 'orange', 'blue']},
    'yellow': {vector: new THREE.Vector3(0, -1, 0), adjacentFaces: ['red', 'blue', 'orange', 'green']},
    'blue': {vector: new THREE.Vector3(0, 0, -1), adjacentFaces: ['white', 'orange', 'yellow', 'red']},
    'green': {vector: new THREE.Vector3(0, 0, 1), adjacentFaces: ['white', 'red', 'yellow', 'orange']},
};

export default class RubiksCube {

    constructor() {
        this.facesByColor = new Map();
        Object.keys(facesDataByColor).map(color => {
            const vector = facesDataByColor[color].vector;
            this.facesByColor.set(color, new RubiksCubeFace(color, vector));
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
                window.setInterval(() => {
                    this.turnQueue.enqueueTurnForFace(this.facesByColor.get('red'), 2);
                    this.turnQueue.enqueueTurnForFace(this.facesByColor.get('orange'), 2);
                    this.turnQueue.enqueueTurnForFace(this.facesByColor.get('white'), 2);
                    this.turnQueue.enqueueTurnForFace(this.facesByColor.get('yellow'), 2);
                    this.turnQueue.enqueueTurnForFace(this.facesByColor.get('green'), 2);
                    this.turnQueue.enqueueTurnForFace(this.facesByColor.get('blue'), 2);
                }, 5000);
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
