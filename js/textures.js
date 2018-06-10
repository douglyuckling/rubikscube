const cubeTextureLoader = new THREE.CubeTextureLoader();

var r = 'textures/Medborgarplatsen/';
var urls = [r + 'posx.jpg', r + 'negx.jpg',
            r + 'posy.jpg', r + 'negy.jpg',
            r + 'posz.jpg', r + 'negz.jpg'];
const environmentMap = cubeTextureLoader.load( urls );
environmentMap.format = THREE.RGBFormat;
environmentMap.mapping = THREE.CubeReflectionMapping;

export default {
    environmentMap
}
