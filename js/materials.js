
const materials = {};

materials['blackPlastic'] = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.05, 0.05, 0.05),
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
};

const coloredStickerMaterials = {};
Object.keys(colors).forEach(colorName => {
    coloredStickerMaterials[`${colorName}Sticker`] = new THREE.MeshStandardMaterial({
        color: colors[colorName],
        envMapIntensity: 2.0,
        metalness: 0.0,
        roughness: 0.075
    });
});

Object.assign(materials, coloredStickerMaterials);

export default materials;
