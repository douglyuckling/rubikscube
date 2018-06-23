import {loadRubiksCube} from './rubiksCubeModel.js';
import RubiksCubeAnimation from './RubiksCubeAnimation.js';

const colors = Object.freeze(['white', 'red', 'blue', 'orange', 'green', 'yellow']);

const facesByColor = {
    'red': {vector: new THREE.Vector3(1, 0, 0), adjacentFaces: ['white', 'blue', 'yellow', 'green']},
    'orange': {vector: new THREE.Vector3(-1, 0, 0), adjacentFaces: ['white', 'green', 'yellow', 'blue']},
    'white': {vector: new THREE.Vector3(0, 1, 0), adjacentFaces: ['red', 'green', 'orange', 'blue']},
    'yellow': {vector: new THREE.Vector3(0, -1, 0), adjacentFaces: ['red', 'blue', 'orange', 'green']},
    'blue': {vector: new THREE.Vector3(0, 0, -1), adjacentFaces: ['white', 'orange', 'yellow', 'red']},
    'green': {vector: new THREE.Vector3(0, 0, 1), adjacentFaces: ['white', 'red', 'yellow', 'orange']},
};

export default class RubiksCubeBehavior {
    constructor() {
        /** @type {Map<String, Array<Mesh>>} */
        this.blockMeshesByCenterColor = new Map();
        colors.forEach(color => this.blockMeshesByCenterColor.set(color, []));

        this._ready = false;
        this.currentAnimation = null;
        this.queuedAnimations = [];
        this.initRubiksCubeBlocks()
            .then(() => {
                this.animateFacesTurning([
                    {faceColor: 'red', turns: 2},
                    {faceColor: 'orange', turns: 2},
                    {faceColor: 'white', turns: 2},
                    {faceColor: 'yellow', turns: 2},
                    {faceColor: 'green', turns: 2},
                    {faceColor: 'blue', turns: 2},
                ]);
            });
    }

    initRubiksCubeBlocks() {
        return loadRubiksCube().then((rubiksCubeScene) => {
            rubiksCubeScene.children.forEach(blockMesh => {
                this.blockMeshesByCenterColor.forEach((blocksHavingThisColor, color) => {
                    if (blockMesh.name.includes(color)) {
                        blocksHavingThisColor.push(blockMesh);
                    }
                });
            });

            this._ready = true;
        });
    }

    get ready() {
        return this._ready;
    }

    animateFacesTurning(steps) {
        if (!this.ready) {
            return;
        }

        const animateNextTurn = (i) => {
            const step = steps[i];
            this.animateFaceTurning(step.faceColor, step.turns).then(() => {
                animateNextTurn((i + 1) % steps.length);
            });
        };
        animateNextTurn(0);
    }

    animateFaceTurning(faceColor, turns) {
        if (!this.ready) {
            return;
        }

        const animation = this.createAnimationForFace(faceColor, turns);
        this.queuedAnimations.push(animation);
        return animation.promise.then(() => {
            this.updateAdjacencyAfterRotation(faceColor, turns);
        });
    }

    createAnimationForFace(faceColor, turns) {
        if (!this.ready) {
            throw Error("Cannot create animation before cube is ready");
        }

        const face = facesByColor[faceColor];
        const blockMeshesOnFace = this.blockMeshesByCenterColor.get(faceColor);

        return new RubiksCubeAnimation(blockMeshesOnFace, face.vector, turns);
    }

    update() {
        if (!this.ready) {
            return;
        }

        if (!this.currentAnimation && this.queuedAnimations.length > 0) {
            const animation = this.queuedAnimations.shift();
            this.currentAnimation = animation;
            animation.promise.then(() => {
                if (this.currentAnimation === animation) {
                    this.currentAnimation = null;
                }
            });
        }

        if (this.currentAnimation) {
            this.currentAnimation.update();
        }
    }

    updateAdjacencyAfterRotation(faceColor, numberOfClockwiseTurns) {
        const adjacentFaces = facesByColor[faceColor].adjacentFaces;
        while (numberOfClockwiseTurns < 0) {
            numberOfClockwiseTurns += adjacentFaces.length;
        }

        const meshesOnRotatedFace = this.blockMeshesByCenterColor.get(faceColor);
        const meshesSharedWithAdjacentFaceByAdjacentFace = new Map();
        adjacentFaces.forEach((adjacentFace) => {
            const adjacentFaceMeshes = this.blockMeshesByCenterColor.get(adjacentFace);
            const meshesSharedWithAdjacentFace = [];
            this.blockMeshesByCenterColor.set(adjacentFace, adjacentFaceMeshes.filter(blockMesh => {
                if (meshesOnRotatedFace.includes(blockMesh)) {
                    meshesSharedWithAdjacentFace.push(blockMesh);
                    return false;
                }
                return true;
            }));
            meshesSharedWithAdjacentFaceByAdjacentFace.set(adjacentFace, meshesSharedWithAdjacentFace);
        });
        adjacentFaces.forEach((oldFace, i) => {
            const newFace = adjacentFaces[(i + numberOfClockwiseTurns) % adjacentFaces.length];
            meshesSharedWithAdjacentFaceByAdjacentFace.get(oldFace).forEach(blockMesh => {
                this.blockMeshesByCenterColor.get(newFace).push(blockMesh);
            });
        });
    }

}
