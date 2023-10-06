import * as THREE from "three";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.120.0/examples/jsm/controls/OrbitControls.js";
import WebGL from "three/addons/capabilities/WebGL.js";
import { mergeBufferGeometries } from "https://cdn.skypack.dev/three-stdlib@2.8.5/utils/BufferGeometryUtils";
import { RGBELoader } from "https://cdn.skypack.dev/three-stdlib@2.8.5/loaders/RGBELoader";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffeecc);

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(-17, 31, 33);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

let controls = new OrbitControls(camera, renderer.domElement);
function hexGeometry(height, position) {
    let geo = new THREE.CylinderGeometry(1, 1, height, 6, 1, false);
    geo.translate(position.x, height * 0.5, position.y);
    return geo;
}
let hexagonGeometries = new THREE.BoxGeometry(0, 0, 0);
function makeHex(height, position) {
    let geo = hexGeometry(height, position);
    hexagonGeometries = mergeBufferGeometries([hexagonGeometries, geo]);
}
let envmap;
(async function () {
    let pmrem = new THREE.PMREMGenerator(renderer);
    let envmapTexture = await new RGBELoader()
        .setDataType(THREE.FloatType)
        .loadAsync("envmap.hdr");
    console.log(envmapTexture);
    envmap = pmrem.fromEquirectangular(envmapTexture).texture;
    for (let i = -10; i < 10; i++) {
        for (let j = -10; j < 10; j++) {
            makeHex(3, tileToPosition(i, j));
        }
    }
    let hexagonMesh = new THREE.Mesh(
        hexagonGeometries,
        new THREE.MeshStandardMaterial({ envMap: envmap, flatShading: true })
    );
    scene.add(hexagonMesh);
    renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
    });
})();

function tileToPosition(tileX, tileY) {
    return new THREE.Vector2((tileX + (tileY % 2) * 0.5) * 1.77, tileY * 1.535);
}

// function animate() {
//     requestAnimationFrame(animate);
//     camera.updateProjectionMatrix();
//     renderer.render(scene, camera);
// }

// if (WebGL.isWebGLAvailable()) {
//     // Initiate function or other initializations here
//     animate();
// } else {
//     const warning = WebGL.getWebGLErrorMessage();
//     document.getElementById("container").appendChild(warning);
// }
