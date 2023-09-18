import * as THREE from "three";
import WebGL from "three/addons/capabilities/WebGL.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var geometry = new THREE.BoxGeometry(2, 2, 2);
var material = new THREE.MeshLambertMaterial({
    color: 0xfd59d7,
    wireframe: false,
});
// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

var light = new THREE.PointLight(0xffff00, 5);
/* position the light so it shines on the cube (x, y, z) */
light.position.set(4, 4, 8);
scene.add(light);

camera.position.z = 5;

const line_material = new THREE.LineBasicMaterial({ color: 0x0000ff });
const points = [];
points.push(new THREE.Vector3(-10, 0, 0));
points.push(new THREE.Vector3(0, 10, 0));
points.push(new THREE.Vector3(10, 0, 0));

const line_geometry = new THREE.BufferGeometry().setFromPoints(points);
const line = new THREE.Line(line_geometry, line_material);
scene.add(line);
renderer.setClearColor(0xffffff, 0);

// setting initial values for required parameters
let acceleration = 9.8;
let bounce_distance = 6;
let bottom_position_y = -2;
let time_step = 0.02;
// time_counter is calculated to be the time the ball just reached the top position
// this is simply calculated with the s = (1/2)gt*t formula, which is the case when ball is dropped from the top position
let time_counter = Math.sqrt((bounce_distance * 2) / acceleration);
let initial_speed = acceleration * time_counter;
let direction = 1;
function animate() {
    requestAnimationFrame(animate);

    if (cube.position.y < bottom_position_y) {
        time_counter = 0;
    }
    // calculate sphere position with the s2 = s1 + ut + (1/2)gt*t formula
    // this formula assumes the ball to be bouncing off from the bottom position when time_counter is zero
    cube.position.y =
        bottom_position_y +
        initial_speed * time_counter -
        0.5 * acceleration * time_counter * time_counter;
    // advance time
    time_counter += time_step;

    cube.rotation.x += 0.005;
    cube.rotation.y += 0.005;

    if (cube.position.x >= 5) {
        direction = -1;
    } else if (cube.position.x <= 0) {
        direction = 1;
    }
    cube.position.x += direction * 0.01;

    camera.updateProjectionMatrix();

    renderer.render(scene, camera);
}

if (WebGL.isWebGLAvailable()) {
    // Initiate function or other initializations here
    animate();
} else {
    const warning = WebGL.getWebGLErrorMessage();
    document.getElementById("container").appendChild(warning);
}
