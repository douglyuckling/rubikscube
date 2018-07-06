import RubiksCubeFaceAnimation from './RubiksCubeFaceAnimation.js';

class Turn {

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
        this.animation = new RubiksCubeFaceAnimation(blockMeshesOnFace, axisOfRotation, this.numberOfClockwiseTurns);
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

export default class TurnQueue {

    constructor(rubiksCube) {
        this.rubiksCube = rubiksCube;
        this.currentTurn = null;
        this.queuedTurns = [];
    }

    enqueueTurnForFace(faceOrientation, numberOfClockwiseTurns) {
        const turn = new Turn(faceOrientation, numberOfClockwiseTurns);
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
