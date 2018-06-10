const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.up = new THREE.Vector3(0,1,0);
const cameraCube = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const scene = new THREE.Scene();
const sceneCube = new THREE.Scene();

const ambient = new THREE.AmbientLight( 0xffffff );
scene.add( ambient );

const textureLoader = new THREE.TextureLoader();
const textureEquirec = textureLoader.load('textures/HDR_110_Tunnel_Bg.jpg');
textureEquirec.mapping = THREE.EquirectangularReflectionMapping;
textureEquirec.magFilter = THREE.LinearFilter;
textureEquirec.minFilter = THREE.LinearMipMapLinearFilter;

const equirectShader = THREE.ShaderLib['equirect'];
const equirectMaterial = new THREE.ShaderMaterial({
    fragmentShader: equirectShader.fragmentShader,
    vertexShader: equirectShader.vertexShader,
    uniforms: equirectShader.uniforms,
    depthWrite: false,
    side: THREE.BackSide
});
equirectMaterial.uniforms['tEquirect'].value = textureEquirec;

const cubeMesh = new THREE.Mesh( new THREE.BoxBufferGeometry( 100, 100, 100 ), equirectMaterial );
cubeMesh.visible = true;
sceneCube.add( cubeMesh );

const geometry = new THREE.SphereBufferGeometry(1, 32, 32);
const sphereMaterial = new THREE.MeshLambertMaterial( { envMap: textureEquirec } );
const sphereMesh = new THREE.Mesh( geometry, sphereMaterial );
scene.add( sphereMesh );

var renderer = new THREE.WebGLRenderer();
renderer.autoClear = false;
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const cameraDistance = 5;
let cameraTheta = 0;

function animate() {
    requestAnimationFrame( animate );

    cameraTheta += 0.01;
    if (cameraTheta >= 2 * Math.PI) { cameraTheta -= 2 * Math.PI; }
    camera.position.x = cameraDistance * Math.sin(cameraTheta);
    camera.position.z = cameraDistance * Math.cos(cameraTheta);
    camera.position.y = cameraDistance * Math.cos(cameraTheta) / 4;
    camera.lookAt(new THREE.Vector3(0,0,0));

    cameraCube.rotation.copy( camera.rotation );

    renderer.render( sceneCube, cameraCube );
    renderer.render( scene, camera );
}
animate();
