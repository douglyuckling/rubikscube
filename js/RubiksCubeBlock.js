export default class RubiksCubeBlock {

    constructor(type, colors) {
        this.type = type;
        this.colors = colors;
    }

    setMesh(mesh) {
        this.mesh = mesh;
        this.updatePose();
    }

    updatePose() {
        this.meshPosition = this.mesh.position.clone();
        this.meshQuaternion = this.mesh.quaternion.clone();
    }

    toString() {
        return `${this.type}Block<${this.colors.join('/')}>`;
    }

}
