var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var geometry = new THREE.SphereGeometry(1, 32, 32);
var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
var sphere = new THREE.Mesh( geometry, material );
scene.add( sphere );

camera.up = new THREE.Vector3(0,1,0);
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

    renderer.render( scene, camera );
}
animate();
