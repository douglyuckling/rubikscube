import {loadRubiksCube} from './rubiksCubeModel.js';

const colors = Object.freeze(['white', 'red', 'blue', 'orange', 'green', 'yellow']);

const axisConfigByColor = {
    'red': {sinAxis: 'y', cosAxis: 'z', rotationDirection: 1, vector: new THREE.Vector3(1, 0, 0)},
    'orange': {sinAxis: 'y', cosAxis: 'z', rotationDirection: -1, vector: new THREE.Vector3(-1, 0, 0)},
    'white': {sinAxis: 'z', cosAxis: 'x', rotationDirection: 1, vector: new THREE.Vector3(0, 1, 0)},
    'yellow': {sinAxis: 'z', cosAxis: 'x', rotationDirection: -1, vector: new THREE.Vector3(0, -1, 0)},
    'blue': {sinAxis: 'x', cosAxis: 'y', rotationDirection: 1, vector: new THREE.Vector3(0, 0, -1)},
    'green': {sinAxis: 'x', cosAxis: 'y', rotationDirection: -1, vector: new THREE.Vector3(0, 0, 1)},
};

const topologyByColor = {
    'red': {adjacentFaces: ['white', 'blue', 'yellow', 'green']},
    'orange': {adjacentFaces: ['white', 'green', 'yellow', 'blue']},
    'white': {adjacentFaces: ['red', 'green', 'orange', 'blue']},
    'yellow': {adjacentFaces: ['red', 'blue', 'orange', 'green']},
    'blue': {adjacentFaces: ['white', 'orange', 'yellow', 'red']},
    'green': {adjacentFaces: ['white', 'red', 'yellow', 'orange']},
};

export default class RubiksCubeBehavior {
    constructor() {
        /** @type {Map<String, Array<Mesh>>} */
        this.blockMeshesByCenterColor = new Map();
        colors.forEach(color => this.blockMeshesByCenterColor.set(color, []));

        this._ready = false;
        this.animations = [];
        this.axisSigns = {x: 0, y: 0, z: 0};
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

            const positionsByColor = new Map();
            colors.forEach(color => {
                const blockMesh = this.blockMeshesByCenterColor.get(color).find(blockMesh => blockMesh.name.includes('center'));
                positionsByColor.set(color, blockMesh.position.clone());
            });
            this.axisSigns['x'] = Math.sign(positionsByColor.get('red').x - positionsByColor.get('orange').x);
            this.axisSigns['y'] = Math.sign(positionsByColor.get('white').y - positionsByColor.get('yellow').y);
            this.axisSigns['z'] = Math.sign(positionsByColor.get('blue').z - positionsByColor.get('green').z);

            this.animateFacesTurning([
                {face: 'red', turns: 2},
                {face: 'orange', turns: 2},
                {face: 'white', turns: 2},
                {face: 'yellow', turns: 2},
                {face: 'green', turns: 2},
                {face: 'blue', turns: 2},
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
            this.animateFaceTurning(step.face, step.turns).then(() => {
                animateNextTurn((i + 1) % steps.length);
            });
        };
        animateNextTurn(0);
    }

    animateFaceTurning(face, turns) {
        if (!this.ready) {
            return;
        }

        const animation = this.createAnimationForFace(face, turns);
        this.animations.push(animation);
        return animation.promise;
    }

    createAnimationForFace(face, turns) {
        if (!this.ready) {
            throw Error("Cannot create animation before cube is ready");
        }

        const axisConfig = axisConfigByColor[face];
        const deltaTheta = -turns * Math.PI / 2;

        const quaternion = new THREE.Quaternion();
        quaternion.setFromAxisAngle(axisConfig.vector, deltaTheta);

        const originalPosesByMesh = new Map();
        const finalPosesByMesh = new Map();
        this.blockMeshesByCenterColor.get(face).forEach(blockMesh => {
            originalPosesByMesh.set(blockMesh, Object.assign({
                quaternion: blockMesh.quaternion.clone(),
            }, this.computePoseInPolarCoordinates(blockMesh, axisConfig)));
            finalPosesByMesh.set(blockMesh, {
                quaternion: blockMesh.quaternion.clone().premultiply(quaternion),
            });
        });

        const animation = {
            face,
            turns,
            axisConfig,
            originalPosesByMesh,
            finalPosesByMesh,
            quaternion,
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

    computePoseInPolarCoordinates(blockMesh, axisConfig) {
        const otherAxis0 = this.axisSigns[axisConfig.sinAxis] * blockMesh.position[axisConfig.sinAxis];
        const otherAxis1 = this.axisSigns[axisConfig.cosAxis] * blockMesh.position[axisConfig.cosAxis];
        return {
            r: Math.sqrt(otherAxis0 ** 2 + otherAxis1 ** 2),
            theta: Math.atan2(otherAxis0, otherAxis1),
        }
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

            const sinAxis = animation.axisConfig.sinAxis;
            const cosAxis = animation.axisConfig.cosAxis;
            const relativeTheta = animation.axisConfig.rotationDirection * t * animation.deltaTheta;

            animation.originalPosesByMesh.forEach((originalPose, blockMesh) => {
                const finalPose = animation.finalPosesByMesh.get(blockMesh);
                THREE.Quaternion.slerp(originalPose.quaternion, finalPose.quaternion, blockMesh.quaternion, t);
                blockMesh.position[sinAxis] = this.axisSigns[sinAxis] * originalPose.r * Math.sin(originalPose.theta + relativeTheta);
                blockMesh.position[cosAxis] = this.axisSigns[cosAxis] * originalPose.r * Math.cos(originalPose.theta + relativeTheta);
            });

            if (t >= 1.0) {
                this.updateAdjacencyAfterRotation(animation.face, animation.turns);
                animation.resolve();
                this.animations.shift();
            }
        }
    }

    updateAdjacencyAfterRotation(color, numberOfClockwiseTurns) {
        const adjacentFaces = topologyByColor[color].adjacentFaces;
        while (numberOfClockwiseTurns < 0) {
            numberOfClockwiseTurns += adjacentFaces.length;
        }

        const meshesOnRotatedFace = this.blockMeshesByCenterColor.get(color);
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
