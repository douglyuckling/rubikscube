import {loadRubiksCube} from './rubiksCubeModel.js';

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
        this.animations = [];
        this.initRubiksCubeBlocks();
    }

    initRubiksCubeBlocks() {
        loadRubiksCube().then((rubiksCubeScene) => {
            rubiksCubeScene.children.forEach(blockMesh => {
                this.blockMeshesByCenterColor.forEach((blocksHavingThisColor, color) => {
                    if (blockMesh.name.includes(color)) {
                        blocksHavingThisColor.push(blockMesh);
                    }
                });
            });

            this._ready = true;

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
        this.animations.push(animation);
        return animation.promise;
    }

    createAnimationForFace(faceColor, turns) {
        if (!this.ready) {
            throw Error("Cannot create animation before cube is ready");
        }

        const deltaTheta = -turns * Math.PI / 2;

        const originalPosesByMesh = new Map();
        this.blockMeshesByCenterColor.get(faceColor).forEach(blockMesh => {
            originalPosesByMesh.set(blockMesh, Object.assign({
                position: blockMesh.position.clone(),
                quaternion: blockMesh.quaternion.clone(),
            }));
        });

        const animation = {
            faceColor,
            turns,
            originalPosesByMesh,
            deltaTheta,
            startTime: null,
            duration: 500,
        };

        animation.promise = new Promise((resolve, reject) => {
            animation.resolve = resolve;
            animation.reject = reject;
        });

        return animation;
    }

    update() {
        if (!this.ready) {
            return;
        }

        if (this.animations.length > 0) {
            const animation = this.animations[0];
            const now = new Date();
            if (!animation.startTime) {
                animation.startTime = now;
            }
            const dt = now - animation.startTime;
            const t = cubicInOut(Math.min(1.0, dt / animation.duration));

            const face = facesByColor[animation.faceColor];
            const quaternion = new THREE.Quaternion().setFromAxisAngle(face.vector, t * animation.deltaTheta);

            animation.originalPosesByMesh.forEach((originalPose, blockMesh) => {
                blockMesh.quaternion.copy(originalPose.quaternion).premultiply(quaternion);
                blockMesh.position.copy(originalPose.position).applyQuaternion(quaternion);
            });

            if (t >= 1.0) {
                this.updateAdjacencyAfterRotation(animation.faceColor, animation.turns);
                animation.resolve();
                this.animations.shift();
            }
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

// Easing stolen from https://github.com/d3/d3-ease/blob/master/src/cubic.js
function cubicInOut(t) {
    return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}
