import {loadRubiksCube} from './rubiksCubeModel.js';

const colors = Object.freeze(['white', 'red', 'blue', 'orange', 'green', 'yellow']);

export default class RubiksCubeBehavior {
    constructor() {
        /** @type {Map<String, Array<Mesh>>} */
        this.blockMeshesByColor = new Map();
        colors.forEach(color => this.blockMeshesByColor.set(color, []));

        this._ready = false;
        this.animations = [];
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

            this.animateRedTurningCounterClockwise();
        });
    }

    get ready() {
        return this._ready;
    }

    animateRedTurningCounterClockwise() {
        if (!this.ready) { return; }

        const originalPosesByMesh = new Map();
        this.blockMeshesByColor.get('red').forEach(blockMesh => {
            originalPosesByMesh.set(blockMesh, {
                rotation: blockMesh.rotation.clone(),
                xAxis: {
                    r: Math.sqrt(blockMesh.position.y ** 2 + blockMesh.position.z ** 2),
                    theta: Math.atan2(blockMesh.position.y, -blockMesh.position.z)
                },
            });
        });

        this.animations.push({
            originalPosesByMesh: originalPosesByMesh,
            theta: 0,
            dTheta: 0.01
        });
    }

    update() {
        if (!this.ready) {
            return;
        }

        if (this.animations.length > 0) {
            const animation = this.animations[0];

            animation.originalPosesByMesh.forEach((originalPose, blockMesh) => {
                blockMesh.rotation.x = originalPose.rotation.x + animation.theta;
                blockMesh.position.y = originalPose.xAxis.r * Math.sin(originalPose.xAxis.theta + animation.theta);
                blockMesh.position.z = -originalPose.xAxis.r * Math.cos(originalPose.xAxis.theta + animation.theta);
            });

            animation.theta += animation.dTheta;
        }
    }

}
