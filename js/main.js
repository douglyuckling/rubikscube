import textures from './textures.js'

function initMainScene() {
    const scene = new THREE.Scene();

    scene.add(new THREE.AmbientLight( 0xffffff ));

    const geometry = new THREE.SphereBufferGeometry(1, 32, 32);
    const sphereMaterial = new THREE.MeshLambertMaterial({
        envMap: textures['environmentMap']
    });
    const sphereMesh = new THREE.Mesh(geometry, sphereMaterial);
    scene.add(sphereMesh);

    return scene;
}

function initSkyBox() {
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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

    function render(renderer, mainCamera) {
        camera.rotation.copy(mainCamera.rotation);
        renderer.render(scene, camera);
    }

    return {
        render,
        camera
    }
}

const scene = initMainScene();
const skyBox = initSkyBox();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.up = new THREE.Vector3(0,1,0);
const cameraDistance = 5;
let cameraTheta = 0;

var renderer = new THREE.WebGLRenderer();
renderer.autoClear = false;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    skyBox.camera.aspect = window.innerWidth / window.innerHeight;
    skyBox.camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);

function render() {
    cameraTheta += 0.01;
    if (cameraTheta >= 2 * Math.PI) { cameraTheta -= 2 * Math.PI; }
    camera.position.x = cameraDistance * Math.sin(cameraTheta);
    camera.position.z = cameraDistance * Math.cos(cameraTheta);
    camera.position.y = cameraDistance * Math.cos(cameraTheta) / 4;
    camera.lookAt(new THREE.Vector3(0,0,0));

    skyBox.render(renderer, camera);
    renderer.render(scene, camera);
}

function animate() {
    requestAnimationFrame(animate);
    render();
}
animate();
