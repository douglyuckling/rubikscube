let faceMeshesPromise = null;

export function loadFaceMeshes() {
    if (!faceMeshesPromise) {
        faceMeshesPromise = new Promise(function(resolve, reject) {
            const gltfLoader = new THREE.GLTFLoader();
            gltfLoader.load(
                'models/rubikscube/rubikscube_block_faces.gltf',
                function onLoad(gltf) {
                    const faceMeshes = {
                        posz: () => gltf.scene.children[0].clone(),
                        posx: () => gltf.scene.children[1].clone(),
                        posy: () => gltf.scene.children[2].clone(),
                        negz: () => gltf.scene.children[3].clone(),
                        negx: () => gltf.scene.children[4].clone(),
                        negy: () => gltf.scene.children[5].clone()
                    };
                    resolve(faceMeshes);
                },
                null,
                function onError(error) {
                    reject(error);
                });
        });
    }

    return faceMeshesPromise;
}
