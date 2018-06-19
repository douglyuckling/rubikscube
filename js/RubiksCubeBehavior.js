import {loadRubiksCube} from './rubiksCubeModel.js';

const colors = Object.freeze(['white', 'red', 'blue', 'orange', 'green', 'yellow']);

const axisConfigByColor = {
    'red': {rotationAxis: 'x', sinAxis: 'y', cosAxis: 'z', rotationDirection: 1},
    'orange': {rotationAxis: 'x', sinAxis: 'y', cosAxis: 'z', rotationDirection: -1},
    'white': {rotationAxis: 'y', sinAxis: 'z', cosAxis: 'x', rotationDirection: 1},
    'yellow': {rotationAxis: 'y', sinAxis: 'z', cosAxis: 'x', rotationDirection: -1},
    'blue': {rotationAxis: 'z', sinAxis: 'x', cosAxis: 'y', rotationDirection: 1},
    'green': {rotationAxis: 'z', sinAxis: 'x', cosAxis: 'y', rotationDirection: -1}
};

export default class RubiksCubeBehavior {
    constructor() {
        /** @type {Map<String, Array<Mesh>>} */
        this.blockMeshesByColor = new Map();
        colors.forEach(color => this.blockMeshesByColor.set(color, []));

        this._ready = false;
        this.animations = [];
        this.axisSigns = {x: 0, y: 0, z: 0};
        this.initRubiksCubeBlocks();
    }

    initRubiksCubeBlocks() {
        loadRubiksCube().then((rubiksCubeScene) => {
            rubiksCubeScene.children.forEach(blockMesh => {
                this.blockMeshesByColor.forEach((blocksHavingThisColor, color) => {
                    if (blockMesh.name.includes(color)) {
                        blocksHavingThisColor.push(blockMesh);
                    }
                });
            });

            this._ready = true;

            const positionsByColor = new Map();
            colors.forEach(color => {
                const blockMesh = this.blockMeshesByColor.get(color).find(blockMesh => blockMesh.name.includes('center'));
                positionsByColor.set(color, blockMesh.position.clone());
            });

            this.axisSigns['x'] = Math.sign(positionsByColor.get('red').x - positionsByColor.get('orange').x);
            this.axisSigns['y'] = Math.sign(positionsByColor.get('white').y - positionsByColor.get('yellow').y);
            this.axisSigns['z'] = Math.sign(positionsByColor.get('blue').z - positionsByColor.get('green').z);
            this.animateColorTurningCounterClockwise('white');
        });
    }

    get ready() {
        return this._ready;
    }

    animateColorTurningCounterClockwise(color) {
        if (!this.ready) {
            return;
        }

        this.animations.push(this.createAnimationForColor(color));
    }

    createAnimationForColor(color) {
        if (!this.ready) {
            throw Error("Cannot create animation before cube is ready");
        }

        const axisConfig = axisConfigByColor[color];
        const originalPosesByMesh = new Map();
        this.blockMeshesByColor.get(color).forEach(blockMesh => {
            originalPosesByMesh.set(blockMesh, Object.assign({
                rotation: blockMesh.rotation.clone(),
            }, this.computePoseInPolarCoordinates(blockMesh, axisConfig)));
        });

        return {
            axisConfig,
            originalPosesByMesh,
            theta: 0,
            dTheta: 0.01
        };
    }

    computePoseInPolarCoordinates(blockMesh, axisConfig) {
        const otherAxis0 = this.axisSigns[axisConfig.sinAxis] * blockMesh.position[axisConfig.sinAxis];
        const otherAxis1 = this.axisSigns[axisConfig.cosAxis] * blockMesh.position[axisConfig.cosAxis];
        return {
            r: Math.sqrt(otherAxis0 ** 2 + otherAxis1 ** 2),
            theta: Math.atan2(otherAxis0, otherAxis1)
        }
    }

    update() {
        if (!this.ready) {
            return;
        }

        if (this.animations.length > 0) {
            const animation = this.animations[0];

            const rotationAxis = animation.axisConfig.rotationAxis;
            const sinAxis = animation.axisConfig.sinAxis;
            const cosAxis = animation.axisConfig.cosAxis;
            const relativeTheta = animation.axisConfig.rotationDirection * animation.theta;

            animation.originalPosesByMesh.forEach((originalPose, blockMesh) => {
                blockMesh.rotation[rotationAxis] = originalPose.rotation[rotationAxis] + this.axisSigns[rotationAxis] * relativeTheta;
                blockMesh.position[sinAxis] = this.axisSigns[sinAxis] * originalPose.r * Math.sin(originalPose.theta + relativeTheta);
                blockMesh.position[cosAxis] = this.axisSigns[cosAxis] * originalPose.r * Math.cos(originalPose.theta + relativeTheta);
            });

            animation.theta += animation.dTheta;
        }
    }

}
