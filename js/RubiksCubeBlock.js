export default class RubiksCubeBlock {

    constructor(type, colors) {
        this.type = type;
        this.colors = colors;
        this.numberOfClockwiseTurnsByAxis = [0, 0, 0];
    }

    setMesh(mesh) {
        this.mesh = mesh;
        this.updatePose();
    }

    turn(axis, numberOfClockwiseTurns) {
        this.numberOfClockwiseTurnsByAxis[axis] = normalizeNumberOfClockwiseTurns(this.numberOfClockwiseTurnsByAxis[axis] + numberOfClockwiseTurns);
    }

    isCorrectlyPositioned() {
        if (this.type === 'center') {
            return true;
        } else {
            return this.numberOfClockwiseTurnsByAxis.every(numberOfClockwiseTurns => numberOfClockwiseTurns === 0);
        }
    }

    updatePose() {
        this.meshPosition = this.mesh.position.clone();
        this.meshQuaternion = this.mesh.quaternion.clone();
    }

    toString() {
        return `${this.type}Block<${this.colors.join('/')}>`;
    }

}

function normalizeNumberOfClockwiseTurns(n) {
    n %= 4;
    if (n < 0) {
        n += 4;
    }
    return n % 4;
}
