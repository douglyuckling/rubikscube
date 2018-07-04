import RubiksCubeFaceAnimation from './RubiksCubeFaceAnimation.js';

class Turn {

    constructor(face, numberOfClockwiseTurns) {
        this.face = face;
        this.numberOfClockwiseTurns = numberOfClockwiseTurns;
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
        this.animation = null;
    }

    createAnimation() {
        if (this.animation) {
            throw Error("An animation has already been created for this turn.");
        }

        const blockMeshesOnFace = this.face.blocks.map(it => it.mesh);
        const axisOfRotation = this.face.vector;
        this.animation = new RubiksCubeFaceAnimation(blockMeshesOnFace, axisOfRotation, this.numberOfClockwiseTurns);
        return this.animation.promise
            .then(() => {
                this.face.turn(this.numberOfClockwiseTurns);
                this.resolve();
            })
            .catch((exception) => {
                this.reject(exception);
            });
    }

}

export default class TurnQueue {

    constructor() {
        this.currentTurn = null;
        this.queuedTurns = [];
    }

    enqueueTurnForFace(face, numberOfClockwiseTurns) {
        const turn = new Turn(face, numberOfClockwiseTurns);
        this.queuedTurns.push(turn);
        return turn.promise;
    }

    update() {
        if (!this.currentTurn && this.queuedTurns.length > 0) {
            this.currentTurn = this.queuedTurns.shift();
            this.currentTurn.createAnimation()
                .then(() => {
                    this.currentTurn = null;
                });
        }

        if (this.currentTurn) {
            this.currentTurn.animation.update();
        }
    }

}
