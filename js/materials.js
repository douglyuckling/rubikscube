import textures from './textures.js';

const materials = {};

materials['blackPlastic'] = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.05, 0.05, 0.05),
    envMap: textures['environmentMap'],
    envMapIntensity: 2.0,
    metalness: 0.0,
    roughness: 0.6
});

const colors = {
    white: new THREE.Color(0.90, 0.90, 0.90),
    red: new THREE.Color(0.95, 0.05, 0.05),
    orange: new THREE.Color(0.95, 0.45, 0.05),
    yellow: new THREE.Color(0.95, 0.95, 0.05),
    green: new THREE.Color(0.05, 0.55, 0.05),
    blue: new THREE.Color(0.05, 0.05, 0.75),
}

const coloredStickerMaterials = {};
Object.keys(colors).forEach(colorName => {
    const material = new THREE.MeshStandardMaterial({
        color: colors[colorName],
        envMap: textures['environmentMap'],
        envMapIntensity: 2.0,
        metalness: 0.0,
        roughness: 0.15
    });
    coloredStickerMaterials[`${colorName}Sticker`] = material;
});

Object.assign(materials, coloredStickerMaterials);

export default materials;
