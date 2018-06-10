import textures from './textures.js';

const blackPlastic = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.05, 0.05, 0.05),
    envMap: textures['environmentMap'],
    envMapIntensity: 3.0,
    metalness: 0.0,
    roughness: 0.6
});

export default {
    blackPlastic
};
