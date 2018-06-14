let faceMeshesPromise = null;

export function loadRubiksCube() {
    if (!faceMeshesPromise) {
        faceMeshesPromise = new Promise(function (resolve, reject) {
            const gltfLoader = new THREE.GLTFLoader();
            gltfLoader.load(
                'models/rubikscube/rubikscube.gltf',
                function onLoad(gltf) {
                    gltf.scene.name = 'rubiks_cube';
                    resolve(gltf.scene);
                },
                null,
                function onError(error) {
                    reject(error);
                });
        });
    }

    return faceMeshesPromise;
}
