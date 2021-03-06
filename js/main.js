import materials from './materials.js';
import {loadRubiksCube} from './rubiksCubeModel.js';
import RubiksCube from './RubiksCube.js';

function initMainScene() {
    const scene = new THREE.Scene();

    scene.background = new THREE.Color(0.2, 0.2, 0.2);
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

const scene = initMainScene();

const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 50);
camera.up = new THREE.Vector3(0, 1, 0);
camera.position.set(7, 7, 13);
camera.lookAt(new THREE.Vector3(0, 0, 0));

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

const clockwiseKeysByOrientation = {
    top: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    front: ['f', 'k'],
    right: ['a', 'g', 'l'],
    back: ['s', 'h'],
    left: ['d', 'j'],
    bottom: ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.'],
};

const anticlockwiseKeysByOrientation = {};
Object.keys(clockwiseKeysByOrientation).forEach(orientation => {
    anticlockwiseKeysByOrientation[orientation] = clockwiseKeysByOrientation[orientation].map(it => it.toUpperCase());
});

window.addEventListener('keydown', (event) => {
    switch(event.key) {
        case 'ArrowLeft':
            event.shiftKey ? rubiksCube.rollLeft() : rubiksCube.rotateLeft();
            break;
        case 'ArrowRight':
            event.shiftKey ? rubiksCube.rollRight() : rubiksCube.rotateRight();
            break;
        case 'ArrowUp':
            rubiksCube.rotateUp();
            break;
        case 'ArrowDown':
            rubiksCube.rotateDown();
            break;
    }

    let numberOfClockwiseTurns = 0;
    let orientation = Object.keys(clockwiseKeysByOrientation).find(orientation => {
        return clockwiseKeysByOrientation[orientation].includes(event.key);
    });
    if (orientation) {
        numberOfClockwiseTurns = 1;
    } else {
        orientation = Object.keys(anticlockwiseKeysByOrientation).find(orientation => {
            return anticlockwiseKeysByOrientation[orientation].includes(event.key);
        });
        if (orientation) {
            numberOfClockwiseTurns = -1;
        }
    }

    if (numberOfClockwiseTurns !== 0) {
        rubiksCube.turnFace(orientation, numberOfClockwiseTurns);
    }
}, false);
