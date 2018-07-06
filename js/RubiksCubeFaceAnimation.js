export default class RubiksCubeFaceAnimation {

    constructor(meshes, axisOfRotation, turns) {
        this.promise = new Promise((resolve, reject) => {
            this.originalPosesByMesh = new Map();
            meshes.forEach(mesh => {
                this.originalPosesByMesh.set(mesh, {
                    position: mesh.position.clone(),
                    quaternion: mesh.quaternion.clone(),
                });
            });

            this.axisOfRotation = axisOfRotation.clone().normalize();
            this.deltaTheta = -turns * Math.PI / 2;
            this.startTime = null;
            this.duration = 250;
            this.complete = false;

            this.resolve = resolve;
            this.reject = reject;
        });
    }

    update() {
        if (this.complete) {
            return;
        }

        const now = new Date();
        if (!this.startTime) {
            this.startTime = now;
        }
        const dt = now - this.startTime;
        const t = cubicInOut(Math.min(1.0, dt / this.duration));

        const quaternion = new THREE.Quaternion().setFromAxisAngle(this.axisOfRotation, t * this.deltaTheta);

        this.originalPosesByMesh.forEach((originalPose, blockMesh) => {
            blockMesh.quaternion.copy(originalPose.quaternion).premultiply(quaternion);
            blockMesh.position.copy(originalPose.position).applyQuaternion(quaternion);
        });

        if (t >= 1.0) {
            this.complete = true;
            this.resolve(this);
        }
    }

}

// Easing stolen from https://github.com/d3/d3-ease/blob/master/src/cubic.js
function cubicInOut(t) {
    return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}
