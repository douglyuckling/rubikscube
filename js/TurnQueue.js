import RotationAnimation from './RotationAnimation.js';

class FaceTurn {

    constructor(faceOrientation, numberOfClockwiseTurns) {
        this.faceOrientation = faceOrientation;
        this.numberOfClockwiseTurns = numberOfClockwiseTurns;
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
        this.animation = null;
    }

    execute(rubiksCube) {
        if (this.animation) {
            throw Error("An animation has already been created for this turn.");
        }

        const face = rubiksCube.getFaceForOrientation(this.faceOrientation);
        const blockMeshesOnFace = face.blocks.map(it => it.mesh);
        const axisOfRotation = face.vector;
        this.animation = new RotationAnimation(blockMeshesOnFace, axisOfRotation, this.numberOfClockwiseTurns);
        this.animation.promise
            .then(() => {
                face.turn(this.numberOfClockwiseTurns);
                this.resolve();
            })
            .catch((exception) => {
                this.reject(exception);
            });
        return this.promise;
    }

}

class CubeTurn {

    constructor(axis, numberOfClockwiseTurns) {
        this.axis = axis;
        this.numberOfClockwiseTurns = numberOfClockwiseTurns;
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
        this.animation = null;
    }

    execute(rubiksCube) {
        if (this.animation) {
            throw Error("An animation has already been created for this turn.");
        }

        const rubiksCubeScene = rubiksCube.rubiksCubeScene;
        if (!rubiksCubeScene) {
            throw Error("Rubiks cube scene is not ready yet.");
        }

        const axisOfRotation = new THREE.Vector3(0, 0, 0);
        axisOfRotation.setComponent(this.axis, 1);

        this.animation = new RotationAnimation([rubiksCubeScene], axisOfRotation, this.numberOfClockwiseTurns);
        this.animation.promise
            .then(() => {
                rubiksCube.rotateFaceColorsByOrientationToViewer(this.axis, this.numberOfClockwiseTurns);
                this.resolve();
            })
            .catch((exception) => {
                this.reject(exception);
            });
        return this.promise;
    }

}

export default class TurnQueue {

    constructor(rubiksCube) {
        this.rubiksCube = rubiksCube;
        this.currentTurn = null;
        this.queuedTurns = [];
    }

    enqueueTurnForFace(faceOrientation, numberOfClockwiseTurns) {
        const turn = new FaceTurn(faceOrientation, numberOfClockwiseTurns);
        this.queuedTurns.push(turn);
        return turn.promise;
    }

    enqueueTurnForCube(axis, numberOfClockwiseTurns) {
        const turn = new CubeTurn(axis, numberOfClockwiseTurns);
        this.queuedTurns.push(turn);
        return turn.promise;
    }

    update() {
        if (!this.currentTurn && this.queuedTurns.length > 0) {
            this.currentTurn = this.queuedTurns.shift();
            this.currentTurn.execute(this.rubiksCube)
                .then(() => {
                    this.currentTurn = null;
                });
        }

        if (this.currentTurn) {
            this.currentTurn.animation.update();
        }
    }

}
