const textureLoader = new THREE.TextureLoader();

const environmentMap = textureLoader.load('textures/HDR_110_Tunnel_Bg.jpg');
environmentMap.mapping = THREE.EquirectangularReflectionMapping;
environmentMap.magFilter = THREE.LinearFilter;
environmentMap.minFilter = THREE.LinearMipMapLinearFilter;

export default {
    environmentMap
}
