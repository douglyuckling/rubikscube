const cubeTextureLoader = new THREE.CubeTextureLoader();

var urls = ['posx.jpg', 'negx.jpg', 'posy.jpg', 'negy.jpg', 'posz.jpg', 'negz.jpg']
    .map(fileName => `textures/Medborgarplatsen/${fileName}`);
const environmentMap = cubeTextureLoader.load(urls);
environmentMap.format = THREE.RGBFormat;
environmentMap.mapping = THREE.CubeReflectionMapping;

export default {
    environmentMap
}
