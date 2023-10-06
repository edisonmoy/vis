import * as THREE from "three";
import TWEEN from "@tweenjs/tween.js";
import { MeshLine, MeshLineMaterial } from "three.meshline";
import WebGL from "three/addons/capabilities/WebGL.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.120.0/examples/jsm/controls/OrbitControls.js";
import { UnrealBloomPass } from "https://cdn.jsdelivr.net/npm/three@0.120.0/examples/jsm/postprocessing/UnrealBloomPass.js";
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.120.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.120.0/examples/jsm/postprocessing/RenderPass.js";

function rgbToHex(r, g, b) {
    var hex = ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
    return parseInt(hex, 16);
}

function hexToRgb(hex) {
    var hex = hex.toString(16);
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
          }
        : null;
}

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

class HexLine {
    constructor(startX, startY, endX, endY, color, z) {
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        this.color = color;
        this.z = z;
        this.width = 0.5;
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
        const material = new MeshLineMaterial({
            color: this.color,
            lineWidth: this.width,
        });
        const line = new MeshLine();
        line.setGeometry(geometry);
        const mesh = new THREE.Mesh(line, material);
        this.line = mesh;
        return line;
    }
    changeColor(color) {
        this.color = color;
        this.line.material = new MeshLineMaterial({
            color: color,
            lineWidth: this.width,
        });
        this.line.material.needsUpdate;
    }
    changeThickness(width) {
        this.width = width;
        this.line.material = new MeshLineMaterial({
            color: this.color,
            lineWidth: width,
        });
        this.line.material.needsUpdate;
    }
    getWidth() {
        return this.width;
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
    setCounterTs(time) {
        this.time = time;
    }
    getTime() {
        return this.time;
    }
}

function findMidpoint(x1, x2, y1, y2) {
    return [(x1 + x2) / 2, (y1 + y2) / 2];
}

function createSegments(x1, x2, y1, y2, n) {
    var segments = [{ x1: x1, x2: x2, y1: y1, y2: y2 }];
    for (var i = 0; i < n; i++) {
        var tempSegs = [];
        segments.forEach((e) => {
            var midPoint = findMidpoint(e.x1, e.x2, e.y1, e.y2);
            tempSegs.push({
                x1: e.x1,
                x2: midPoint[0],
                y1: e.y1,
                y2: midPoint[1],
            });
            tempSegs.push({
                x1: midPoint[0],
                x2: e.x2,
                y1: midPoint[1],
                y2: e.y2,
            });
        });
        segments = tempSegs;
    }
    return segments;
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

const MAX_HEXES = 1;

let prevX = 0,
    prevY = 0;
let originX = 0;
let originY = 0;
let startingX = 0,
    startingY = 0;
let z = 0;
let existingLinesSet = new Set();
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

        var segments = createSegments(prevX, currX, prevY, currY, 4);

        for (var j = 0; j < segments.length; j++) {
            const e = segments[j];
            let hexLine = new HexLine(e.x1, e.y1, e.x2, e.y2, color, z);

            if (!existingLinesSet.has(hexLine.getHashId())) {
                hexLines.push(hexLine);
                existingLinesSet.add(hexLine.getHashId());
            }
        }
        (prevX = currX), (prevY = currY);
    }
}

hexLines.forEach((x) => scene.add(x.getLine()));

const randomHexIndex = Math.floor(Math.random() * hexLines.length);
let currLine = hexLines[randomHexIndex];
let prevLine = currLine;
const newColor = 0xd51919;
let originalColor = 0x459632;
const MAX_ANIMATE = 10000;
let counter = 0;
const changedLines = new Set();

let clock = new THREE.Clock();
let delta = 0;
// 5 fps == 1/5
let interval = 1 / 60;

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

let notPrinted = true;
const stepsAnimate = 16;

function interpolateColors(color1, color2, steps) {
    const colorSpectrum = [];
    const color1RGB = hexToRgb(color1);
    const color2RGB = hexToRgb(color2);
    const diffR = color2RGB.r - color1RGB.r,
        diffG = color2RGB.g - color1RGB.g,
        diffB = color2RGB.b - color1RGB.b;

    for (var i = 0; i < steps; i++) {
        const mult = (i + 1) / steps;
        const newR = color1RGB.r + diffR * mult,
            newG = color1RGB.g + diffG * mult,
            newB = color1RGB.b + diffB * mult;
        colorSpectrum.push(rgbToHex(newR, newG, newB));
    }
    return colorSpectrum;
}

const colorSpectrum = interpolateColors(newColor, originalColor, stepsAnimate);

function animate() {
    delta += clock.getDelta();

    if (delta > interval) {
        // The draw or time dependent code are here
        if (counter == MAX_ANIMATE && notPrinted) {
            console.log("DONE");
            notPrinted = false;
        }
        if (counter < MAX_ANIMATE) {
            changedLines.forEach((e) => {
                const currThickness = e.getWidth();
                e.changeThickness(currThickness - 0.5 / stepsAnimate);
                const countTime = counter - e.getTime();
                const colorIdx = Math.min(countTime, colorSpectrum.length - 1);
                e.changeColor(colorSpectrum[colorIdx]);
                if (countTime > stepsAnimate) {
                    changedLines.delete(e);
                    e.changeColor(originalColor);
                    e.changeThickness(0.5);
                }
            });
            if (!changedLines.has(currLine)) {
                currLine.setCounterTs(counter);
                changedLines.add(currLine);
            }
            currLine.changeColor(newColor);
            currLine.changeThickness(1);
            const currLineEndCoords = currLine.getEndCoords();
            let lines = hexLines;
            if (counter % stepsAnimate == 0) {
                lines = shuffle(hexLines);
            }
            for (let i = 0; i < lines.length; i++) {
                const nextLine = lines[i];
                const nextLineStartCoords = nextLine.getStartCoords();
                const nextLineEndCoords = nextLine.getEndCoords();
                if (
                    currLine.getHashId() !== nextLine.getHashId() &&
                    nextLine.getHashId() !== prevLine.getHashId()
                ) {
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
        // line.rotation.x += 0.005;
        // line.rotation.y += 0.006;
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
