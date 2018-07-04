import RubiksCubeAnimation from './RubiksCubeAnimation.js';

class Turn {

    constructor(face, quarterTurns) {
        this.face = face;
        this.quarterTurns = quarterTurns;
    }

    createAnimation() {
        const blockMeshesOnFace = this.face.blocks.map(it => it.mesh);
        const axisOfRotation = this.face.vector;
        this.animation = new RubiksCubeAnimation(blockMeshesOnFace, axisOfRotation, this.quarterTurns);
        return this.animation.promise.then(() => {
            this.face.turn(this.quarterTurns);
        });
    }

}

export default class TurnQueue {

    constructor() {
        this.currentTurn = null;
        this.queuedTurns = [];
    }

    enqueueTurnForFace(face, quarterTurns) {
        this.queuedTurns.push(new Turn(face, quarterTurns));
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
