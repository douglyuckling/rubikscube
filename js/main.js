import textures from './textures.js';
import materials from './materials.js';
import {loadRubiksCube} from './rubiksCubeModel.js';
import RubiksCube from './RubiksCube.js';

function initMainScene() {
    const scene = new THREE.Scene();

    scene.add(new THREE.AmbientLight(new THREE.Color(0.8, 0.8, 0.8)));

    loadRubiksCube().then((rubiksCubeScene) => {
        const getStickerMaterial = (stickerName) => {
            const matches = /sticker_([^_]+)_/.exec(stickerName);
            const color = (matches && matches.length > 1) ? matches[1] : null;
            return color ? materials[`${color}Sticker`] : null;
        };
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

const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 50);
camera.up = new THREE.Vector3(0, 1, 0);
camera.position.set(7, 7, 13);
camera.lookAt(new THREE.Vector3(0, 0, 0));

const skyBox = initSkyBox(camera);

var renderer = new THREE.WebGLRenderer({antialias: true});
renderer.autoClear = false;
renderer.setPixelRatio(window.devicePixelRatio);
updateRendererSize();
document.body.appendChild(renderer.domElement);

const rubiksCube = new RubiksCube();

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
    rubiksCube.update();

    skyBox.render(renderer, camera);
    renderer.render(scene, camera);
}

function animate() {
    try {
        render();
    } catch(e) {
        window.paused = true;
        console.error(e);
    }

    if (!window.paused) {
        requestAnimationFrame(animate);
    }
}
animate();

window.addEventListener('keyup', (event) => {
    if (event.code === 'Space') {
        window.paused = !window.paused;
        if (!window.paused) {
            animate();
        }
    }
}, false);

window.addEventListener('keydown', (event) => {
    switch(event.key) {
        case 'ArrowLeft':
            rubiksCube.rotateLeft();
            break;
        case 'ArrowRight':
            rubiksCube.rotateRight();
            break;
        case 'ArrowUp':
            rubiksCube.rotateUp();
            break;
        case 'ArrowDown':
            rubiksCube.rotateDown();
            break;
    }
}, false);
