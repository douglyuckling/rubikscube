import textures from './textures.js'
import materials from './materials.js'
import {loadRubiksCube} from './rubiksCubeModel.js'

function initMainScene() {
    const scene = new THREE.Scene();

    scene.add(new THREE.AmbientLight(new THREE.Color(0.8, 0.8, 0.8)));

    loadRubiksCube().then((rubiksCubeScene) => {
        const getStickerMaterial = (stickerName) => {
            const matches = /sticker_([^_]+)_/.exec(stickerName);
            const color = (matches && matches.length > 1) ? matches[1] : null;
            return color ? materials[`${color}Sticker`] : null;
        }
        rubiksCubeScene.children.forEach(block => {
            block.material = materials['blackPlastic'];
            block.children.forEach(sticker => {
                sticker.material = getStickerMaterial(sticker.name);
            });
        });
        scene.add(rubiksCubeScene);
    });

    return scene;
}

function initSkyBox(mainCamera) {
    const camera = new THREE.PerspectiveCamera(
        mainCamera.fov,
        mainCamera.aspect,
        mainCamera.near,
        mainCamera.far);
    const scene = new THREE.Scene();

    const shader = THREE.ShaderLib['cube'];
    const material = new THREE.ShaderMaterial({
        fragmentShader: shader.fragmentShader,
        vertexShader: shader.vertexShader,
        uniforms: shader.uniforms,
        depthWrite: false,
        side: THREE.BackSide
    });
    material.uniforms['tCube'].value = textures['environmentMap'];

    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(100, 4), material);
    mesh.visible = true;
    scene.add(mesh);

    function render(renderer) {
        camera.rotation.copy(mainCamera.rotation);
        renderer.render(scene, camera);
    }

    return {
        render,
        camera
    }
}

const scene = initMainScene();

const camera = new THREE.PerspectiveCamera(75, 16/9, 0.1, 50);
camera.up = new THREE.Vector3(0,1,0);
camera.position.set(11, 8, 11);
camera.lookAt(new THREE.Vector3(0,0,0));

const skyBox = initSkyBox(camera);

var renderer = new THREE.WebGLRenderer({antialias: true});
renderer.autoClear = false;
renderer.setPixelRatio(window.devicePixelRatio);
updateRendererSize();
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false;
controls.minDistance = 14;
controls.maxDistance = 14;
controls.maxPolarAngle = Math.PI;

window.addEventListener('resize', () => {
    updateRendererSize();
}, false);

function updateRendererSize() {
    const windowAspectRatio = window.innerWidth / window.innerHeight;
    if (windowAspectRatio < camera.aspect) {
        renderer.setSize(window.innerWidth, window.innerWidth / camera.aspect);
    } else {
        renderer.setSize(camera.aspect * window.innerHeight, window.innerHeight);
    }
}

function render() {
    controls.update();

    skyBox.render(renderer, camera);
    renderer.render(scene, camera);
}

function animate() {
    requestAnimationFrame(animate);
    render();
}
animate();
