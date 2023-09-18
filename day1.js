import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";
import WebGL from "three/addons/capabilities/WebGL.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.120.0/examples/jsm/controls/OrbitControls.js";
import { UnrealBloomPass } from "https://cdn.jsdelivr.net/npm/three@0.120.0/examples/jsm/postprocessing/UnrealBloomPass.js";
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.120.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.120.0/examples/jsm/postprocessing/RenderPass.js";

THREE.Color.prototype.getHSV = function () {
    var rr,
        gg,
        bb,
        h,
        s,
        r = this.r,
        g = this.g,
        b = this.b,
        v = Math.max(r, g, b),
        diff = v - Math.min(r, g, b),
        diffc = function (c) {
            return (v - c) / 6 / diff + 1 / 2;
        };

    if (diff == 0) {
        h = s = 0;
    } else {
        s = diff / v;
        rr = diffc(r);
        gg = diffc(g);
        bb = diffc(b);

        if (r === v) {
            h = bb - gg;
        } else if (g === v) {
            h = 1 / 3 + rr - bb;
        } else if (b === v) {
            h = 2 / 3 + gg - rr;
        }
        if (h < 0) {
            h += 1;
        } else if (h > 1) {
            h -= 1;
        }
    }
    return {
        h: h,
        s: s,
        v: v,
    };
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 0, 5).setLength(5);

const renderer = new THREE.WebGLRenderer();
let controls = new OrbitControls(camera, renderer.domElement);

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var light = new THREE.PointLight(0xffff00, 5);
/* position the light so it shines on the cube (x, y, z) */
light.position.set(0, 0, 8);
scene.add(light);

renderer.setClearColor(0x3b3ba7, 0);

// Set up an effect composer
let composer = new EffectComposer(renderer);
composer.setSize(window.innerWidth, window.innerHeight);

// Tell composer that first pass is rendering scene to buffer
var renderScene = new RenderPass(scene, camera);
composer.addPass(renderScene);

// Tell composer that second pass is adding bloom effect
var bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
);
composer.addPass(bloomPass);

// Tells composer that second pass gets rendered to screen
bloomPass.renderToScreen = true;

// update positions
// updatePositions();

class HexLine {
    constructor(startX, startY, endX, endY, color, z) {
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        this.color = color;
        this.z = z;
        this.createLine();
    }
    getHashId() {
        /**
         * Returns a hash code from a string
         * @param  {String} str The string to hash.
         * @return {Number}    A 32bit integer
         * @see http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
         */
        function hashCode(str) {
            let hash = 0;
            for (let i = 0, len = str.length; i < len; i++) {
                let chr = str.charCodeAt(i);
                hash = (hash << 5) - hash + chr;
                hash |= 0; // Convert to 32bit integer
            }
            return hash;
        }

        if (this.startX < this.endX) {
            let temp = this.startX;
            this.startX = this.endX;
            this.endX = temp;

            temp = this.startY;
            this.startY = this.endY;
            this.endY = temp;
        }
        return hashCode(
            `${this.startX} ${this.startY} ${this.endX} ${this.endY}`
        );
    }
    getLine() {
        return this.line;
    }
    createLine() {
        let points = [];
        points.push(new THREE.Vector3(this.startX, this.startY, this.z));
        points.push(new THREE.Vector3(this.endX, this.endY, this.z));
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: color });
        const line = new THREE.Line(geometry, material);
        this.line = line;
        // this.scene.add(line);
        return line;
    }
    changeColor(color) {
        this.color = color;
        this.line.material = new THREE.LineBasicMaterial({ color: color });
        this.line.material.needsUpdate;
    }
    getColor() {
        return this.color;
    }
    getStartCoords() {
        return [this.startX, this.startY];
    }
    getEndCoords() {
        return [this.endX, this.endY];
    }
    switchCoords() {
        const tempX = this.startX,
            tempY = this.startY;
        (this.startX = this.endX), (this.startY = this.endY);
        this.endX = tempX;
        this.endY = tempY;
    }
}

const hex_points = [
    [2, 3.5],
    [4, 0],
    [2, -3.5],
    [-2, -3.5],
    [-4, 0],
    [-2, 3.5],
];
let hexLines = [];
let hexLines1 = [];

const MAX_HEXES = 1;

let prevX = 0,
    prevY = 0;
let originX = 0;
let originY = 0;
let startingX = 0,
    startingY = 0;
let z = 0;
let z1 = 10;
let existingLinesSet = new Set();
let existingLinesSet1 = new Set();
for (let g = 0; g < 7; g++) {
    if (g == 0) {
        startingX = originX;
        startingY = originY;
    } else if (g == 1) {
        startingX = originX + 6;
        startingY = originY + 3.5;
    } else if (g == 2) {
        startingX = originX + 6;
        startingY = originY - 3.5;
    } else if (g == 3) {
        startingX = originX;
        startingY = originY - 7;
    } else if (g == 4) {
        startingX = originX - 6;
        startingY = originY - 3.5;
    } else if (g == 5) {
        startingX = originX - 6;
        startingY = originY + 3.5;
    } else if (g == 6) {
        startingX = originX;
        startingY = originY + 7;
    }

    for (let i = 0; i < hex_points.length; i++) {
        let point_idx = i % hex_points.length;
        if (point_idx == 0) {
            prevX = hex_points[hex_points.length - 1][0] + startingX;
            prevY = hex_points[hex_points.length - 1][1] + startingY;
        }
        let currX = hex_points[point_idx][0] + startingX;
        let currY = hex_points[point_idx][1] + startingY;

        var color = 0x459632;

        let hexLine = new HexLine(prevX, prevY, currX, currY, color, z);
        if (!existingLinesSet.has(hexLine.getHashId())) {
            hexLines.push(hexLine);
            existingLinesSet.add(hexLine.getHashId());
        }

        hexLine = new HexLine(prevX, prevY, currX, currY, color, z1);
        if (!existingLinesSet1.has(hexLine.getHashId())) {
            hexLines1.push(hexLine);
            existingLinesSet1.add(hexLine.getHashId());
        }

        (prevX = currX), (prevY = currY);
    }
}

hexLines.forEach((x) => scene.add(x.getLine()));
hexLines1.forEach((x) => scene.add(x.getLine()));

// let her = lines[5].material.color.getHSV();
// console.log(her);
// console.log(her.h);
// new TWEEN.Tween(lines[5].material.color.getHSV())
//     .to({ h: her.h, s: her.s, v: her.v }, 200)
//     .easing(TWEEN.Easing.Quartic.In)
//     .onUpdate(function () {
//         lines[5].material.color.setHSV(this.h, this.s, this.v);
//     })
//     .start();

const randomHexIndex = Math.floor(Math.random() * hexLines.length);
let currLine = hexLines[randomHexIndex];
let prevLine = currLine;
const newColor = 0xd51919;
let originalColor = currLine.getColor();
const MAX_ANIMATE = 100;
let counter = 0;

let clock = new THREE.Clock();
let delta = 0;
// 5 fps
let interval = 1 / 5;

function shuffle(array) {
    let currentIndex = array.length,
        randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex > 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex],
            array[currentIndex],
        ];
    }

    return array;
}

function animate() {
    delta += clock.getDelta();

    if (delta > interval) {
        // The draw or time dependent code are here
        if (counter < MAX_ANIMATE) {
            prevLine.changeColor(originalColor);
            originalColor = currLine.getColor();
            currLine.changeColor(newColor);
            const currLineEndCoords = currLine.getEndCoords();
            // console.log(
            //     `Currline [${currLineStartCoords}] [${currLineEndCoords}]`
            // );
            const shuffledLines = shuffle(hexLines);
            for (let i = 0; i < shuffledLines.length; i++) {
                const nextLine = shuffledLines[i];
                // Watch out, maybe need to randomize search
                const nextLineStartCoords = nextLine.getStartCoords();
                const nextLineEndCoords = nextLine.getEndCoords();
                if (currLine.getHashId() !== nextLine.getHashId()) {
                    if (
                        currLineEndCoords[0] == nextLineStartCoords[0] &&
                        currLineEndCoords[1] == nextLineStartCoords[1]
                    ) {
                        prevLine = currLine;
                        currLine = hexLines[i];
                        break;
                    } else if (
                        currLineEndCoords[0] == nextLineEndCoords[0] &&
                        currLineEndCoords[1] == nextLineEndCoords[1]
                    ) {
                        prevLine = currLine;
                        currLine = hexLines[i];
                        currLine.switchCoords();
                        break;
                    }
                }
            }
            counter++;
        }
        delta = delta % interval;
    }

    hexLines.forEach((x) => {
        const line = x.getLine();
        line.rotation.x += 0.005;
        line.rotation.y += 0.006;
    });
    hexLines1.forEach((x) => {
        const line = x.getLine();
        line.rotation.x -= 0.008;
        line.rotation.y += 0.005;
    });
    requestAnimationFrame(animate);

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
