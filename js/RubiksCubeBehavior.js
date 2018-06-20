import {loadRubiksCube} from './rubiksCubeModel.js';

const colors = Object.freeze(['white', 'red', 'blue', 'orange', 'green', 'yellow']);

const axisConfigByColor = {
    'red': {rotationAxis: 'x', sinAxis: 'y', cosAxis: 'z', rotationDirection: 1},
    'orange': {rotationAxis: 'x', sinAxis: 'y', cosAxis: 'z', rotationDirection: -1},
    'white': {rotationAxis: 'y', sinAxis: 'z', cosAxis: 'x', rotationDirection: 1},
    'yellow': {rotationAxis: 'y', sinAxis: 'z', cosAxis: 'x', rotationDirection: -1},
    'blue': {rotationAxis: 'z', sinAxis: 'x', cosAxis: 'y', rotationDirection: 1},
    'green': {rotationAxis: 'z', sinAxis: 'x', cosAxis: 'y', rotationDirection: -1},
};

const topologyByColor = {
    'red': {adjacentFaces: ['white', 'green', 'yellow', 'blue']},
    'orange': {adjacentFaces: ['white', 'blue', 'yellow', 'green']},
    'white': {adjacentFaces: ['red', 'blue', 'orange', 'green']},
    'yellow': {adjacentFaces: ['red', 'green', 'orange', 'blue']},
    'blue': {adjacentFaces: ['white', 'red', 'yellow', 'orange']},
    'green': {adjacentFaces: ['white', 'orange', 'yellow', 'red']},
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

            this.animateColorsTurningCounterClockwise(['green', 'red']);
        });
    }

    get ready() {
        return this._ready;
    }

    animateColorsTurningCounterClockwise(colorSequence) {
        if (!this.ready) {
            return;
        }

        const animateNextColor = (i) => {
            const color = colorSequence[i];
            this.animateColorTurningCounterClockwise(color).then(() => {
                animateNextColor((i + 1) % colorSequence.length);
            });
        };
        animateNextColor(0);
    }

    animateColorTurningCounterClockwise(color) {
        if (!this.ready) {
            return;
        }

        const animation = this.createAnimationForColor(color);
        this.animations.push(animation);
        return animation.promise;
    }

    createAnimationForColor(color) {
        if (!this.ready) {
            throw Error("Cannot create animation before cube is ready");
        }

        const axisConfig = axisConfigByColor[color];
        const originalPosesByMesh = new Map();
        this.blockMeshesByCenterColor.get(color).forEach(blockMesh => {
            originalPosesByMesh.set(blockMesh, Object.assign({
                rotation: blockMesh.rotation.clone(),
            }, this.computePoseInPolarCoordinates(blockMesh, axisConfig)));
        });

        const animation = {
            color,
            axisConfig,
            originalPosesByMesh,
            deltaTheta: Math.PI / 2,
            startTime: null,
            duration: 2000,
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
            const t = Math.min(1.0, dt / animation.duration);

            const rotationAxis = animation.axisConfig.rotationAxis;
            const sinAxis = animation.axisConfig.sinAxis;
            const cosAxis = animation.axisConfig.cosAxis;
            const relativeTheta = animation.axisConfig.rotationDirection * t * animation.deltaTheta;

            animation.originalPosesByMesh.forEach((originalPose, blockMesh) => {
                blockMesh.rotation[rotationAxis] = originalPose.rotation[rotationAxis] + this.axisSigns[rotationAxis] * relativeTheta;
                blockMesh.position[sinAxis] = this.axisSigns[sinAxis] * originalPose.r * Math.sin(originalPose.theta + relativeTheta);
                blockMesh.position[cosAxis] = this.axisSigns[cosAxis] * originalPose.r * Math.cos(originalPose.theta + relativeTheta);
            });

            if (t >= 1.0) {
                this.updateAdjacencyAfterRotation(animation.color, 1);
                animation.resolve();
                this.animations.shift();
            }
        }
    }

    updateAdjacencyAfterRotation(color, numberOfCcwTurns) {
        const adjacentFaces = topologyByColor[color].adjacentFaces;
        while (numberOfCcwTurns < 0) {
            numberOfCcwTurns += adjacentFaces.length;
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
            const newFace = adjacentFaces[(i + numberOfCcwTurns) % adjacentFaces.length];
            meshesSharedWithAdjacentFaceByAdjacentFace.get(oldFace).forEach(blockMesh => {
                this.blockMeshesByCenterColor.get(newFace).push(blockMesh);
            });
        });
    }

}
