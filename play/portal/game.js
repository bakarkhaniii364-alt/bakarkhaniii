import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { sfx } from './sfx.js?v=6';
import { handlePhysics, checkTeleportation } from './physics.js?v=6';
import { levels, buildWall } from './levels.js?v=6';

// ----------------- Game State Variables -----------------
let scene, camera, renderer, clock;
let pCameraBlue, pCameraOrange;
    let renderTargetBlue, renderTargetOrange;

    let currentLevelIndex = 0;
    let levelComplete = false;
    let gameFinished = false;
    let startTime = 0;
    let totalPlayTime = 0;
    let lastUnpauseTime = 0;
    let portalsFired = 0;
    let mouseLocked = false;
    let isPaused = false;
    let isMovingElevator = false;
    let elevatorHumSound = null;

    const player = {
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    height: 1.8,
    radius: 0.6,
    yaw: Math.PI,
    pitch: 0,
    onGround: false,
    speed: 8,
    jumpStrength: 9.5,
    holding: null,
    grabDist: 3.5,
    prevPosition: new THREE.Vector3()
};

const keys = { w: false, a: false, s: false, d: false, space: false };

// ----------------- Colliders & Entity Refs -----------------
let colliders = [];
let levelLights = [];
const portals = {
    blue:   { active: false, position: new THREE.Vector3(), normal: new THREE.Vector3(), mesh: null, viewMesh: null, wallId: null },
    orange: { active: false, position: new THREE.Vector3(), normal: new THREE.Vector3(), mesh: null, viewMesh: null, wallId: null }
};
window.portals = portals;
window.player = player;

let companionCube = null;
let companionCubeSpawnPos = new THREE.Vector3();
let companionCubeGLB = null;

let floorButton = null;
let buttonBase = null;
let elevatorDoor = null;
let elevatorRoomGroup = null;
let acidMesh = null;
let fizzlerMesh = null;
let portalGun = null;

let firingLines = [];
let particles = [];
let stepTimer = 0;



// ----------------- Procedural Companion Cube Mesh -----------------
function createCompanionCubeMesh() {
    const group = new THREE.Group();
    
    // Core
    const coreGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const coreMat = new THREE.MeshStandardMaterial({ color: 0x424242, roughness: 0.5, metalness: 0.6 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.castShadow = true;
    core.receiveShadow = true;
    group.add(core);

    // Bevel frame plates
    const frameGeo = new THREE.BoxGeometry(1.25, 0.35, 0.35);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x9e9e9e, roughness: 0.3, metalness: 0.8 });
    
    for (let i = 0; i < 3; i++) {
        const p = new THREE.Mesh(frameGeo, frameMat);
        p.castShadow = true;
        if(i === 1) p.rotation.y = Math.PI/2;
        if(i === 2) p.rotation.z = Math.PI/2;
        group.add(p);
    }

    // Glowing pink heart side centers
    const heartCenterGeo = new THREE.BoxGeometry(0.55, 0.55, 1.26);
    const heartCenterMat = new THREE.MeshStandardMaterial({ 
        color: 0xff4081, 
        emissive: 0xf50057, 
        emissiveIntensity: 0.8,
        roughness: 0.2
    });
    const h1 = new THREE.Mesh(heartCenterGeo, heartCenterMat);
    const h2 = new THREE.Mesh(heartCenterGeo, heartCenterMat);
    h2.rotation.y = Math.PI/2;
    const h3 = new THREE.Mesh(heartCenterGeo, heartCenterMat);
    h3.rotation.x = Math.PI/2;
    group.add(h1, h2, h3);

    return group;
}

// ----------------- Procedural Portal Gun Mesh -----------------
function createPortalGunMesh() {
    const group = new THREE.Group();
    
    // White barrel cover
    const coverGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.35, 12);
    const coverMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.15, metalness: 0.2 });
    const cover = new THREE.Mesh(coverGeo, coverMat);
    cover.rotation.x = Math.PI/2;
    cover.castShadow = true;
    group.add(cover);

    // Black central nozzle
    const nozzleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.42, 12);
    const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.4, metalness: 0.9 });
    const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzle.rotation.x = Math.PI/2;
    nozzle.position.z = -0.05;
    group.add(nozzle);

    // Glowing core indicator
    const coreGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const coreMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x00bcff,
        emissiveIntensity: 1.0
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(0, 0.06, 0.05);
    group.add(core);
    group.userData = { coreMat: coreMat };

    // Metal prongs
    const prongGeo = new THREE.BoxGeometry(0.015, 0.12, 0.05);
    const prongMat = new THREE.MeshStandardMaterial({ color: 0x616161, metalness: 0.9 });
    
    const p1 = new THREE.Mesh(prongGeo, prongMat);
    p1.position.set(0.07, 0, -0.22);
    p1.rotation.y = 0.2;
    
    const p2 = new THREE.Mesh(prongGeo, prongMat);
    p2.position.set(-0.07, 0, -0.22);
    p2.rotation.y = -0.2;
    
    group.add(p1, p2);

    return group;
}

// ----------------- Procedural Button & Fizzler & Door -----------------
function createButtonAndDoor(level) {
    if (level.buttonPos) {
        const btnGroup = new THREE.Group();
        const baseGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.3, 16);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x424242, metalness: 0.8, roughness: 0.3 });
        buttonBase = new THREE.Mesh(baseGeo, baseMat);
        buttonBase.receiveShadow = true;
        btnGroup.add(buttonBase);

        const pressGeo = new THREE.CylinderGeometry(1.0, 1.0, 0.25, 16);
        const pressMat = new THREE.MeshStandardMaterial({ 
            color: 0xd50000, 
            emissive: 0x310000, 
            roughness: 0.2 
        });
        floorButton = new THREE.Mesh(pressGeo, pressMat);
        floorButton.position.y = 0.2;
        floorButton.castShadow = true;
        btnGroup.add(floorButton);

        btnGroup.position.copy(level.buttonPos);
        scene.add(btnGroup);
    }

    if (level.doorPos) {
        // Hollow Door Frame (Left post, right post, top post)
        const frameGroup = new THREE.Group();
        const postMat = new THREE.MeshStandardMaterial({ color: 0x263238, metalness: 0.8, roughness: 0.4 });
        
        // Left post: width 0.4, height 4.0, depth 0.2
        const leftPostGeo = new THREE.BoxGeometry(0.4, 4.0, 0.2);
        const leftPost = new THREE.Mesh(leftPostGeo, postMat);
        leftPost.position.set(-2.0, 0, 0);
        leftPost.receiveShadow = true;
        leftPost.castShadow = true;
        frameGroup.add(leftPost);
        
        // Right post: width 0.4, height 4.0, depth 0.2
        const rightPostGeo = new THREE.BoxGeometry(0.4, 4.0, 0.2);
        const rightPost = new THREE.Mesh(rightPostGeo, postMat);
        rightPost.position.set(2.0, 0, 0);
        rightPost.receiveShadow = true;
        rightPost.castShadow = true;
        frameGroup.add(rightPost);
        
        // Top post: width 4.4, height 0.4, depth 0.2
        const topPostGeo = new THREE.BoxGeometry(4.4, 0.4, 0.2);
        const topPost = new THREE.Mesh(topPostGeo, postMat);
        topPost.position.set(0, 2.2, 0);
        topPost.receiveShadow = true;
        topPost.castShadow = true;
        frameGroup.add(topPost);
        
        frameGroup.position.copy(level.doorPos);

        elevatorRoomGroup = new THREE.Group();
        elevatorRoomGroup.add(frameGroup);

        // Slide Panels (Oriented to block Z corridor: width along X, thickness along Z)
        elevatorDoor = new THREE.Group();
        const panelGeo = new THREE.BoxGeometry(1.8, 4.0, 0.08);
        const panelMat = new THREE.MeshStandardMaterial({ 
            color: 0x37474f, 
            emissive: 0x00bcff, 
            emissiveIntensity: 0.15, 
            metalness: 0.9, 
            roughness: 0.2 
        });
        const d1 = new THREE.Mesh(panelGeo, panelMat);
        d1.position.set(level.doorPos.x - 0.9, level.doorPos.y, level.doorPos.z);
        const d2 = new THREE.Mesh(panelGeo, panelMat);
        d2.position.set(level.doorPos.x + 0.9, level.doorPos.y, level.doorPos.z);
        elevatorDoor.add(d1, d2);
        scene.add(elevatorDoor);

        // Bounding box for physical block
        const dBox = new THREE.Box3();
        dBox.min.set(level.doorPos.x - 1.8, level.doorPos.y - 2.0, level.doorPos.z - 0.1);
        dBox.max.set(level.doorPos.x + 1.8, level.doorPos.y + 2.0, level.doorPos.z + 0.1);
        dBox.userData = { door: true, openY: 0 };
        colliders.push(dBox);

        // Enclosed Elevator Room (behind the doorway)
        const elMat = new THREE.MeshStandardMaterial({ color: 0x1c2833, metalness: 0.8, roughness: 0.3 });
        
        const doorZ = level.doorPos.z;
        const elZ = level.elevatorPos.z;
        const elCenterZ = (doorZ + elZ) / 2 - 1.0;
        const elLength = Math.abs(doorZ - elZ) + 2.0;
        
        // Floor
        const elFloorGeo = new THREE.BoxGeometry(4.0, 0.1, elLength);
        const elFloor = new THREE.Mesh(elFloorGeo, elMat);
        elFloor.position.set(level.elevatorPos.x, level.doorPos.y - 2.05, elCenterZ);
        elFloor.receiveShadow = true;
        elevatorRoomGroup.add(elFloor);
        
        // Ceiling
        const elCeilGeo = new THREE.BoxGeometry(4.0, 0.1, elLength);
        const elCeil = new THREE.Mesh(elCeilGeo, elMat);
        elCeil.position.set(level.elevatorPos.x, level.doorPos.y + 2.05, elCenterZ);
        elevatorRoomGroup.add(elCeil);
        
        // Left Wall
        const elLeftGeo = new THREE.BoxGeometry(0.1, 4.0, elLength);
        const elLeft = new THREE.Mesh(elLeftGeo, elMat);
        elLeft.position.set(level.elevatorPos.x - 2.0, level.doorPos.y, elCenterZ);
        elevatorRoomGroup.add(elLeft);
        
        // Right Wall
        const elRightGeo = new THREE.BoxGeometry(0.1, 4.0, elLength);
        const elRight = new THREE.Mesh(elRightGeo, elMat);
        elRight.position.set(level.elevatorPos.x + 2.0, level.doorPos.y, elCenterZ);
        elevatorRoomGroup.add(elRight);
        
        // Back Wall
        const elBackGeo = new THREE.BoxGeometry(4.0, 4.0, 0.1);
        const elBack = new THREE.Mesh(elBackGeo, elMat);
        elBack.position.set(level.elevatorPos.x, level.doorPos.y, elZ - 1.0);
        elevatorRoomGroup.add(elBack);
        
        scene.add(elevatorRoomGroup);

        // Physics colliders for elevator boundaries
        const buildElevatorCollider = (mesh) => {
            mesh.updateMatrixWorld();
            const box = new THREE.Box3().setFromObject(mesh);
            box.userData = { wallId: 'elevator' };
            colliders.push(box);
        };
        buildElevatorCollider(elFloor);
        buildElevatorCollider(elCeil);
        buildElevatorCollider(elLeft);
        buildElevatorCollider(elRight);
        buildElevatorCollider(elBack);
    }

    if (level.fizzlerPos) {
        // Glowing purple force field
        const fGeo = new THREE.PlaneGeometry(0.1, 4.0);
        fGeo.scale(1, 1, 4.0); // stretch over space
        const fMat = new THREE.MeshBasicMaterial({
            color: 0xaa00ff,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        fizzlerMesh = new THREE.Mesh(fGeo, fMat);
        fizzlerMesh.rotation.y = Math.PI / 2;
        fizzlerMesh.position.copy(level.fizzlerPos);
        scene.add(fizzlerMesh);

        // Add floating lights to represent Fizzler emitters
        const emitterGeo = new THREE.BoxGeometry(0.3, 4.0, 0.3);
        const emitterMat = new THREE.MeshStandardMaterial({ color: 0x1e1e1e, metalness: 0.9 });
        const leftE = new THREE.Mesh(emitterGeo, emitterMat);
        leftE.position.set(level.fizzlerPos.x, level.fizzlerPos.y, level.fizzlerPos.z - 2.1);
        const rightE = new THREE.Mesh(emitterGeo, emitterMat);
        rightE.position.set(level.fizzlerPos.x, level.fizzlerPos.y, level.fizzlerPos.z + 2.1);
        scene.add(leftE, rightE);
    }
}

// ----------------- GLaDOS Dialog Subtitle Player -----------------
let dialogTimeout = null;
let subtitleInterval = null;

function showSubtitle(text) {
    const box = document.getElementById('subtitle-box');
    if (!box) return;
    
    if (subtitleInterval) clearInterval(subtitleInterval);
    box.innerText = "";
    box.classList.add('visible');
    
    let charIndex = 0;
    sfx.playGLaDOS(false); // static hum
    
    subtitleInterval = setInterval(() => {
        if (charIndex < text.length) {
            box.innerText += text[charIndex];
            if (charIndex % 2 === 0) sfx.playGLaDOS(true); // typewriter beep
            charIndex++;
        } else {
            clearInterval(subtitleInterval);
            // Hide after a duration
            setTimeout(() => {
                box.classList.remove('visible');
            }, 3500);
        }
    }, 30);
}

function queueDialogs(dialogList) {
    if (dialogTimeout) clearTimeout(dialogTimeout);
    let index = 0;
    
    const playNext = () => {
        if (index < dialogList.length) {
            showSubtitle(dialogList[index].text);
            index++;
            dialogTimeout = setTimeout(playNext, 6000); // 6s per voice line
        }
    };
    playNext();
}

// ----------------- Portal Setup & dynamic Render targets -----------------
function initPortals() {
    // Inner fill disc (shows the portal view)
    const discGeo = new THREE.CircleGeometry(0.6, 48);
    discGeo.scale(1.0, 1.7, 1.0);

    // Outer ring border (glowing rim)
    const ringGeo = new THREE.RingGeometry(0.6, 0.78, 48);
    ringGeo.scale(1.0, 1.7, 1.0);

    // Match render targets to screen size so screen-space UVs sample correctly (capped for mobile performance)
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const pixelRatio = isMobile ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.5);
    const rtW = Math.max(window.innerWidth * pixelRatio, 1);
    const rtH = Math.max(window.innerHeight * pixelRatio, 1);
    renderTargetBlue   = new THREE.WebGLMultisampleRenderTarget(rtW, rtH, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    renderTargetOrange = new THREE.WebGLMultisampleRenderTarget(rtW, rtH, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });

    // Screen-space projective portal view shader
    // Uses the PORTAL CAMERA's matrices (passed as uniforms) to project
    // the disc vertices into the portal camera's screen space for UV lookup.
    // When unconnected, uses mesh UVs to render a procedural swirl.
    const portalVertexShader = `
        varying vec2 vUv;
        varying vec4 vScreenPos;
        void main() {
            vUv = uv;
            // Standard transform for the main camera rasterization
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            // Screen-space position for UV lookup
            vScreenPos = gl_Position;
        }
    `;
    const portalFragmentShader = `
        uniform sampler2D tPortal;
        uniform float uConnected;
        uniform float uTime;
        uniform vec3 uPortalColor;
        varying vec2 vUv;
        varying vec4 vScreenPos;
        void main() {
            if (uConnected > 0.5) {
                vec2 uv = (vScreenPos.xy / vScreenPos.w) * 0.5 + 0.5;
                gl_FragColor = texture2D(tPortal, uv);
            } else {
                vec2 center = vec2(0.5, 0.5);
                vec2 toCenter = vUv - center;
                float r = length(toCenter) * 2.0; // 0 to 1
                float theta = atan(toCenter.y, toCenter.x);
                
                // Swirl pattern
                float swirl = theta - r * 8.0 + uTime * 6.0;
                float pattern = sin(swirl) * 0.5 + 0.5;
                
                float swirl2 = theta - r * 16.0 - uTime * 4.0;
                float pattern2 = cos(swirl2) * 0.5 + 0.5;
                
                float finalPattern = mix(pattern, pattern2, 0.3);
                
                float alpha = smoothstep(1.0, 0.6, r);
                
                vec3 color = mix(uPortalColor, vec3(1.0, 1.0, 1.0), finalPattern * 0.5);
                color += vec3(1.0) * smoothstep(0.4, 0.0, r) * 0.5;
                
                gl_FragColor = vec4(color, alpha * 0.85);
            }
        }
    `;

    const matBlue = new THREE.ShaderMaterial({
        vertexShader: portalVertexShader,
        fragmentShader: portalFragmentShader,
        uniforms: {
            tPortal: { value: renderTargetBlue.texture },
            portalViewMatrix: { value: new THREE.Matrix4() },
            portalProjectionMatrix: { value: new THREE.Matrix4() },
            uConnected: { value: 0.0 },
            uTime: { value: 0.0 },
            uPortalColor: { value: new THREE.Color(0x00bcff) }
        },
        side: THREE.DoubleSide,
        depthWrite: false,
        transparent: true,
        polygonOffset: true,
        polygonOffsetFactor: -1.0,
        polygonOffsetUnits: -4.0
    });
    const matOrange = new THREE.ShaderMaterial({
        vertexShader: portalVertexShader,
        fragmentShader: portalFragmentShader,
        uniforms: {
            tPortal: { value: renderTargetOrange.texture },
            portalViewMatrix: { value: new THREE.Matrix4() },
            portalProjectionMatrix: { value: new THREE.Matrix4() },
            uConnected: { value: 0.0 },
            uTime: { value: 0.0 },
            uPortalColor: { value: new THREE.Color(0xff8400) }
        },
        side: THREE.DoubleSide,
        depthWrite: false,
        transparent: true,
        polygonOffset: true,
        polygonOffsetFactor: -1.0,
        polygonOffsetUnits: -4.0
    });

    const borderBlueMat = new THREE.MeshBasicMaterial({
        color: 0x00bcff,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -2.0, // slightly closer than the disc
        polygonOffsetUnits: -4.0
    });
    const borderOrangeMat = new THREE.MeshBasicMaterial({
        color: 0xff8400,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -2.0,
        polygonOffsetUnits: -4.0
    });

    // Blue Portal Group: filled disc (view) + ring border
    const pBlue = new THREE.Group();
    const discB = new THREE.Mesh(discGeo, matBlue);          // filled view area
    discB.position.z = 0.01;
    const ringB = new THREE.Mesh(ringGeo, borderBlueMat);    // glowing border
    ringB.position.z = 0.015;
    pBlue.add(discB, ringB);
    pBlue.visible = false;
    scene.add(pBlue);
    portals.blue.mesh = pBlue;
    portals.blue.viewMesh = discB;   // keep ref for visibility toggle

    // Orange Portal Group: filled disc (view) + ring border
    const pOrange = new THREE.Group();
    const discO = new THREE.Mesh(discGeo.clone(), matOrange);
    discO.position.z = 0.01;
    const ringO = new THREE.Mesh(ringGeo.clone(), borderOrangeMat);
    ringO.position.z = 0.015;
    pOrange.add(discO, ringO);
    pOrange.visible = false;
    scene.add(pOrange);
    portals.orange.mesh = pOrange;
    portals.orange.viewMesh = discO;

    pCameraBlue = new THREE.PerspectiveCamera(75, rtW / rtH, 0.1, 100);
    pCameraOrange = new THREE.PerspectiveCamera(75, rtW / rtH, 0.1, 100);
}

function tryFirePortal(isBlue) {
    if (isMovingElevator || gameFinished || isPaused) return;
    
    sfx.playShoot(isBlue);
    portalsFired++;
    
    // Animate weapon muzzle color flash
    if (portalGun && portalGun.userData.coreMat) {
        portalGun.userData.coreMat.emissive.setHex(isBlue ? 0x00bcff : 0xff8400);
        portalGun.position.z += 0.08; // weapon recoil bump
    }

    // Set crosshair indicators to glowing
    const side = isBlue ? 'crosshair-left' : 'crosshair-right';
    const otherSide = isBlue ? 'crosshair-right' : 'crosshair-left';
    document.getElementById(side).classList.add('active');

    // Raycast forward from camera center
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    
    const intersects = raycaster.intersectObjects(scene.children, true);
    let validHit = null;

    for (const hit of intersects) {
        if (hit.object.userData.isPortalable === undefined) continue;
        validHit = hit;
        break;
    }

    if (validHit) {
        const targetWall = validHit.object;
        
        if (!targetWall.userData.isPortalable) {
            // Fired at non-portalable wall: draw red beam and buzzer
            triggerFiringBeam(isBlue, validHit.point, false);
            return;
        }

        // Configure portal position and align outward facing from surface
        const pActive = isBlue ? portals.blue : portals.orange;
        pActive.active = true;
        pActive.normal.copy(validHit.face.normal).applyQuaternion(targetWall.quaternion);

        // Clamp portal to target wall face boundaries
        let portalPos = validHit.point.clone();
        if (targetWall.geometry && targetWall.geometry.parameters) {
            const gw = targetWall.geometry.parameters.width;
            const gh = targetWall.geometry.parameters.height;
            const gd = targetWall.geometry.parameters.depth;
            const localPos = targetWall.worldToLocal(validHit.point.clone());
            const localNormal = validHit.face.normal;

            const clampSafe = (val, halfSize, padding) => {
                const min = -halfSize + padding;
                const max = halfSize - padding;
                if (min > max) return 0;
                return THREE.MathUtils.clamp(val, min, max);
            };

            // Portal ellipse dimensions: horizontal radius 0.6, vertical radius 1.02
            if (Math.abs(localNormal.x) > 0.9) {
                localPos.y = clampSafe(localPos.y, gh / 2, 1.02);
                localPos.z = clampSafe(localPos.z, gd / 2, 0.6);
            } else if (Math.abs(localNormal.z) > 0.9) {
                localPos.x = clampSafe(localPos.x, gw / 2, 0.6);
                localPos.y = clampSafe(localPos.y, gh / 2, 1.02);
            } else if (Math.abs(localNormal.y) > 0.9) {
                localPos.x = clampSafe(localPos.x, gw / 2, 1.02);
                localPos.z = clampSafe(localPos.z, gd / 2, 1.02);
            }
            portalPos = targetWall.localToWorld(localPos);
        }

        pActive.position.copy(portalPos);

        // Position mesh with a tiny offset of 0.005 to sit flat on the wall (relies on polygonOffset to prevent Z-fighting)
        pActive.mesh.position.copy(pActive.position).addScaledVector(pActive.normal, 0.005);
        
        const lookAtTarget = pActive.position.clone().add(pActive.normal);
        pActive.mesh.lookAt(lookAtTarget);
        pActive.mesh.visible = true;
        pActive.wallId = targetWall.userData.wallId;

        // Visual tracers & particles
        triggerFiringBeam(isBlue, pActive.position, true);
        spawnImpactParticles(pActive.position, isBlue ? 0x00bcff : 0xff8400);

        // Update HUD
        const textNode = document.getElementById(isBlue ? 'hud-blue' : 'hud-orange');
        if (textNode) {
            textNode.innerText = "LINK ESTABLISHED";
            textNode.className = `hud-value ${isBlue ? 'blue' : 'orange'}`;
        }
    }
}

function triggerFiringBeam(isBlue, hitPoint, succeeded) {
    const gunPos = new THREE.Vector3(0.18, -0.2, -0.45).applyMatrix4(camera.matrixWorld);
    const geom = new THREE.BufferGeometry().setFromPoints([gunPos, hitPoint]);
    const mat = new THREE.LineBasicMaterial({
        color: succeeded ? (isBlue ? 0x00bcff : 0xff8400) : 0xd50000,
        linewidth: 4,
        transparent: true,
        opacity: 0.8
    });
    const line = new THREE.Line(geom, mat);
    scene.add(line);
    firingLines.push({ mesh: line, time: clock.getElapsedTime() });
}

function spawnImpactParticles(pos, colorHex) {
    for (let i = 0; i < 15; i++) {
        const geo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
        const mat = new THREE.MeshBasicMaterial({ color: colorHex });
        const p = new THREE.Mesh(geo, mat);
        p.position.copy(pos);
        p.userData = {
            vel: new THREE.Vector3(
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4 + 2,
                (Math.random() - 0.5) * 4
            ),
            birth: clock.getElapsedTime()
        };
        scene.add(p);
        particles.push(p);
    }
}

// ----------------- Rendering Dynamic Portal Textures -----------------
function renderPortals() {
    if (!portals.blue.active || !portals.orange.active) return;

    const savedAutoClear = renderer.autoClear;
    renderer.autoClear = true;

    // --- Render BLUE portal face ---
    // The blue disc shows what you'd see stepping through the blue portal
    // and looking out from the orange portal. So we place pCameraBlue at the
    // orange side, mirroring the player's relative pose from the blue side.
    setPortalCamera(pCameraBlue, portals.blue, portals.orange);

    // Pass the portal camera matrices to the blue disc shader so it can
    // project its vertices into the portal camera's clip space for UV lookup.
    const blueDiscMat = portals.blue.viewMesh.material;
    blueDiscMat.uniforms.portalViewMatrix.value.copy(pCameraBlue.matrixWorldInverse);
    blueDiscMat.uniforms.portalProjectionMatrix.value.copy(pCameraBlue.projectionMatrix);

    portals.blue.mesh.visible = false;    // hide blue portal so it doesn't occlude the camera
    portals.orange.viewMesh.visible = false;  // hide orange disc to avoid recursive rendering
    renderer.setRenderTarget(renderTargetBlue);
    renderer.render(scene, pCameraBlue);
    portals.blue.mesh.visible = true;
    portals.orange.viewMesh.visible = true;

    // --- Render ORANGE portal face ---
    setPortalCamera(pCameraOrange, portals.orange, portals.blue);

    const orangeDiscMat = portals.orange.viewMesh.material;
    orangeDiscMat.uniforms.portalViewMatrix.value.copy(pCameraOrange.matrixWorldInverse);
    orangeDiscMat.uniforms.portalProjectionMatrix.value.copy(pCameraOrange.projectionMatrix);

    portals.orange.mesh.visible = false;
    portals.blue.viewMesh.visible = false;
    renderer.setRenderTarget(renderTargetOrange);
    renderer.render(scene, pCameraOrange);
    portals.orange.mesh.visible = true;
    portals.blue.viewMesh.visible = true;

    renderer.setRenderTarget(null);
    renderer.autoClear = savedAutoClear;
}

function updatePortalTrackingHUD() {
    const hudTrackBlue = document.getElementById('hud-tracking-blue');
    const hudTrackOrange = document.getElementById('hud-tracking-orange');
    const trackBlueVal = document.getElementById('hud-track-blue-val');
    const trackOrangeVal = document.getElementById('hud-track-orange-val');

    if (!hudTrackBlue || !hudTrackOrange || !trackBlueVal || !trackOrangeVal) return;

    const playerDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);

    // Blue Portal
    if (portals.blue.active && portals.blue.mesh) {
        hudTrackBlue.style.display = 'flex';
        
        const localPos = portals.blue.mesh.worldToLocal(player.position.clone());
        const distance = player.position.distanceTo(portals.blue.position);
        
        const invQuat = portals.blue.mesh.quaternion.clone().invert();
        const localDir = playerDir.clone().applyQuaternion(invQuat).normalize();
        const localYaw = Math.atan2(localDir.x, -localDir.z) * (180 / Math.PI);
        const localPitch = Math.asin(THREE.MathUtils.clamp(localDir.y, -1, 1)) * (180 / Math.PI);

        trackBlueVal.innerText = `Dist: ${distance.toFixed(1)}m | Pos: (${localPos.x.toFixed(1)}, ${localPos.y.toFixed(1)}, ${localPos.z.toFixed(1)}) | Yaw: ${localYaw.toFixed(0)}° Pitch: ${localPitch.toFixed(0)}°`;
    } else {
        hudTrackBlue.style.display = 'none';
    }

    // Orange Portal
    if (portals.orange.active && portals.orange.mesh) {
        hudTrackOrange.style.display = 'flex';
        
        const localPos = portals.orange.mesh.worldToLocal(player.position.clone());
        const distance = player.position.distanceTo(portals.orange.position);
        
        const invQuat = portals.orange.mesh.quaternion.clone().invert();
        const localDir = playerDir.clone().applyQuaternion(invQuat).normalize();
        const localYaw = Math.atan2(localDir.x, -localDir.z) * (180 / Math.PI);
        const localPitch = Math.asin(THREE.MathUtils.clamp(localDir.y, -1, 1)) * (180 / Math.PI);

        trackOrangeVal.innerText = `Dist: ${distance.toFixed(1)}m | Pos: (${localPos.x.toFixed(1)}, ${localPos.y.toFixed(1)}, ${localPos.z.toFixed(1)}) | Yaw: ${localYaw.toFixed(0)}° Pitch: ${localPitch.toFixed(0)}°`;
    } else {
        hudTrackOrange.style.display = 'none';
    }
}

// srcPortal: the portal the player LOOKS AT (e.g. blue)
// dstPortal: the portal where the camera emerges FROM (e.g. orange)
// The camera placed at dstPortal mirrors the player's view through srcPortal.
function setPortalCamera(portalCam, srcPortal, dstPortal) {
    // Transform: world -> src-portal-local -> flip 180° -> dst-portal-world
    // portalCamWorld = mDst * flip * mSrc^-1 * playerCam
    const mSrc = srcPortal.mesh.matrixWorld;
    const mDst = dstPortal.mesh.matrixWorld;
    const flip = new THREE.Matrix4().makeRotationY(Math.PI);

    // Build srcToDst = mDst * flip * mSrc^-1
    const srcToDst = new THREE.Matrix4()
        .copy(mDst)
        .multiply(flip)
        .multiply(mSrc.clone().invert());

    // Apply to the main camera's current world matrix
    portalCam.matrixAutoUpdate = false;
    portalCam.matrixWorld.multiplyMatrices(srcToDst, camera.matrixWorld);

    // CRITICAL: Three.js uses matrixWorldInverse (not matrixWorld) to build the view matrix.
    portalCam.matrixWorldInverse.copy(portalCam.matrixWorld).invert();

    // Copy FOV / aspect from main camera, then apply oblique near-plane clipping
    portalCam.projectionMatrix.copy(camera.projectionMatrix);

    // --- Oblique near-plane clipping ---
    // Clip anything behind the destination portal surface so we don't render
    // geometry that is behind the wall the exit portal sits on.
    // The clip plane is the destination portal's surface plane in camera space.
    const dstNormal = dstPortal.normal.clone();
    const dstPos = dstPortal.position.clone();

    // Transform portal plane into portal-camera view space
    const viewMat = portalCam.matrixWorldInverse;
    const clipNormal = dstNormal.clone().transformDirection(viewMat);
    const clipPoint = dstPos.clone().applyMatrix4(viewMat);
    const clipDist = -clipPoint.dot(clipNormal);

    // Only apply oblique clipping when the camera is in front of the portal
    // (clipPoint.z should be negative in view space = in front of camera)
    if (clipPoint.z < 0) {
        const clipPlane = new THREE.Vector4(clipNormal.x, clipNormal.y, clipNormal.z, clipDist);
        applyObliqueNearClip(portalCam, clipPlane);
    }

    portalCam.projectionMatrixInverse.copy(portalCam.projectionMatrix).invert();
}

// Modifies the projection matrix to use an oblique near plane defined by clipPlane.
// This is the standard technique from Eric Lengyel's paper.
function applyObliqueNearClip(cam, clipPlane) {
    const proj = cam.projectionMatrix;
    const q = new THREE.Vector4();

    // Calculate the clip-space corner point opposite the clipping plane
    q.x = (Math.sign(clipPlane.x) + proj.elements[8]) / proj.elements[0];
    q.y = (Math.sign(clipPlane.y) + proj.elements[9]) / proj.elements[5];
    q.z = -1.0;
    q.w = (1.0 + proj.elements[10]) / proj.elements[14];

    // Scale the plane so that it replaces the near plane
    const dot = clipPlane.x * q.x + clipPlane.y * q.y + clipPlane.z * q.z + clipPlane.w * q.w;
    const c = clipPlane.clone().multiplyScalar(2.0 / dot);

    // Replace the third row of the projection matrix
    proj.elements[2] = c.x;
    proj.elements[6] = c.y;
    proj.elements[10] = c.z + 1.0;
    proj.elements[14] = c.w;
}

// ----------------- Interactive Elements Updates -----------------
function updateInteractiveElements() {
    const level = levels[currentLevelIndex];

    // Button Activation Check
    if (floorButton && level.buttonPos) {
        let isPressed = false;
        
        // 2D horizontal distance and vertical height checks for player
        const dxPlayer = player.position.x - level.buttonPos.x;
        const dzPlayer = player.position.z - level.buttonPos.z;
        const dist2DPlayer = Math.sqrt(dxPlayer * dxPlayer + dzPlayer * dzPlayer);
        const feetY = player.position.y - 0.9;
        const onButtonHeightPlayer = Math.abs(feetY - level.buttonPos.y) < 0.6;
        
        if (dist2DPlayer < 1.6 && onButtonHeightPlayer) {
            isPressed = true;
        }

        // 2D horizontal distance and vertical height checks for companion cube
        if (companionCube && !companionCube.isHeld) {
            const dxCube = companionCube.mesh.position.x - level.buttonPos.x;
            const dzCube = companionCube.mesh.position.z - level.buttonPos.z;
            const dist2DCube = Math.sqrt(dxCube * dxCube + dzCube * dzCube);
            const cubeBottomY = companionCube.mesh.position.y - 0.6;
            const onButtonHeightCube = Math.abs(cubeBottomY - level.buttonPos.y) < 0.6;
            
            if (dist2DCube < 1.6 && onButtonHeightCube) {
                isPressed = true;
            }
        }

        const targetY = isPressed ? -0.05 : 0.2;
        const currentY = floorButton.position.y;
        
        if (Math.abs(currentY - targetY) > 0.01) {
            floorButton.position.y = THREE.MathUtils.lerp(currentY, targetY, 0.2);
            floorButton.material.emissive.setHex(isPressed ? 0x00e676 : 0x310000);
            floorButton.material.color.setHex(isPressed ? 0x00e676 : 0xd50000);

            // Audio hum transition
            if ((isPressed && currentY > 0.1) || (!isPressed && currentY < 0.0)) {
                sfx.playButton(isPressed);
                showSubtitle(isPressed ? "PRESSURE PLATE ACTIVATED: OVERRIDE ONLINE" : "PRESSURE PLATE DISENGAGED");
            }
        }

        // Open door based on button state, unless elevator is moving
        const doorCol = colliders.find(c => c.userData.door);
        if (doorCol) {
            const shouldBeOpen = isPressed && !isMovingElevator;
            doorCol.userData.openY = shouldBeOpen ? 1 : 0;
            
            const leftPanel = elevatorDoor.children[0];
            const rightPanel = elevatorDoor.children[1];
            
            const targetXOffset = shouldBeOpen ? 2.5 : 0.9;
            
            // Slide door mesh
            const diff = Math.abs(leftPanel.position.x - (level.doorPos.x - targetXOffset));
            if (diff > 0.02) {
                leftPanel.position.x = THREE.MathUtils.lerp(leftPanel.position.x, level.doorPos.x - targetXOffset, 0.1);
                rightPanel.position.x = THREE.MathUtils.lerp(rightPanel.position.x, level.doorPos.x + targetXOffset, 0.1);
                
                // Sound sliding effect
                if (diff > 0.3 && Math.random() < 0.05) {
                    sfx.playDoor(shouldBeOpen);
                }
            }
        }
    } else if (elevatorDoor && !level.buttonPos) {
        // Exit Door is always open if there is no button, unless elevator is moving
        const doorCol = colliders.find(c => c.userData.door);
        if (doorCol) {
            const shouldBeOpen = !isMovingElevator;
            doorCol.userData.openY = shouldBeOpen ? 1 : 0;
            
            const leftPanel = elevatorDoor.children[0];
            const rightPanel = elevatorDoor.children[1];
            
            const targetXOffset = shouldBeOpen ? 2.5 : 0.9;
            
            const diff = Math.abs(leftPanel.position.x - (level.doorPos.x - targetXOffset));
            if (diff > 0.02) {
                leftPanel.position.x = THREE.MathUtils.lerp(leftPanel.position.x, level.doorPos.x - targetXOffset, 0.1);
                rightPanel.position.x = THREE.MathUtils.lerp(rightPanel.position.x, level.doorPos.x + targetXOffset, 0.1);
                
                if (diff > 0.3 && Math.random() < 0.05) {
                    sfx.playDoor(shouldBeOpen);
                }
            }
        }
    }

    // Fizzler Emancipation grid Check
    if (fizzlerMesh && companionCube && !companionCube.isHeld) {
        const cBox = new THREE.Box3().setFromObject(companionCube.mesh);
        const fBox = new THREE.Box3().setFromObject(fizzlerMesh);
        
        if (cBox.intersectsBox(fBox)) {
            // Fizzle / Dissolve companion cube!
            sfx.playFizzler();
            showSubtitle("WARNING: OBJECT EVAPORATED BY EMANCIPATION GRILL");
            
            // Fizzler screen flash
            const flash = document.getElementById('screen-flash');
            if (flash) {
                flash.className = 'dissolve';
                flash.style.opacity = '0.7';
                setTimeout(() => flash.style.opacity = '0', 200);
            }

            // Vaporization particles
            spawnImpactParticles(companionCube.mesh.position, 0xaa00ff);

            // Reset cube to spawn position
            companionCube.mesh.position.copy(companionCubeSpawnPos);
            companionCube.velocity.set(0, 0, 0);
        }
    }
}

// ----------------- Grabbing companion cube -----------------
function tryGrabObject() {
    if (isPaused) return;
    if (player.holding) {
        dropHeldObject();
        return;
    }

    if (!companionCube) return;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    
    // 1. Check direct grab first
    const intersects = raycaster.intersectObject(companionCube.mesh, true);
    if (intersects.length > 0 && intersects[0].distance < player.grabDist) {
        player.holding = companionCube;
        companionCube.isHeld = true;
        companionCube.velocity.set(0, 0, 0);
        sfx.playGrab();
        showSubtitle("COMPANION CUBE SECURED");
        return;
    }

    // 2. Check grab through portals (if both are active)
    if (portals.blue.active && portals.orange.active) {
        const portalIntersects = raycaster.intersectObjects([portals.blue.viewMesh, portals.orange.viewMesh]);
        if (portalIntersects.length > 0 && portalIntersects[0].distance < player.grabDist) {
            const hitPortalMesh = portalIntersects[0].object;
            const hitDist = portalIntersects[0].distance;
            
            const srcPortal = (hitPortalMesh === portals.blue.viewMesh) ? portals.blue : portals.orange;
            const dstPortal = (hitPortalMesh === portals.blue.viewMesh) ? portals.orange : portals.blue;
            
            // Transform ray through the portal to the other side
            const flipRotation = new THREE.Matrix4().makeRotationY(Math.PI);
            const srcToDst = new THREE.Matrix4()
                .copy(srcPortal.mesh.matrixWorld).invert()
                .premultiply(flipRotation)
                .premultiply(dstPortal.mesh.matrixWorld);
            
            const pRay = raycaster.ray.clone().applyMatrix4(srcToDst);
            const pRaycaster = new THREE.Raycaster(pRay.origin, pRay.direction);
            const remainingDist = player.grabDist - hitDist;
            
            const pIntersects = pRaycaster.intersectObject(companionCube.mesh, true);
            if (pIntersects.length > 0 && pIntersects[0].distance < remainingDist) {
                // Grab success! Teleport to player side immediately
                player.holding = companionCube;
                companionCube.isHeld = true;
                companionCube.velocity.set(0, 0, 0);
                sfx.playGrab();
                showSubtitle("COMPANION CUBE SECURED THROUGH PORTAL");
            }
        }
    }
}

export function dropHeldObject() {
    if (!player.holding) return;
    
    player.holding.isHeld = false;
    player.holding.velocity.set(0, 0, 0); // Drop with 0 velocity
    
    player.holding = null;
    sfx.playRelease();
    showSubtitle("COMPANION CUBE RELEASED");
}

function updateHeldObject(dt) {
    if (!player.holding) return;
    
    // Float cube 2.3m in front of camera smoothly
    const targetPos = new THREE.Vector3(0, 0, -2.3).applyMatrix4(camera.matrixWorld);
    player.holding.mesh.position.lerp(targetPos, 0.22);
    player.holding.mesh.rotation.y += 0.5 * dt; // gentle float spin
    player.holding.velocity.set(0, 0, 0);
}

// ----------------- Level Loading System -----------------
function loadLevel(index) {
    currentLevelIndex = index;
    levelComplete = false;
    isMovingElevator = false;
    
    // Reset HUD text values
    const blueVal = document.getElementById('hud-blue');
    const orangeVal = document.getElementById('hud-orange');
    if (blueVal) { blueVal.innerText = "INACTIVE"; blueVal.className = "hud-value"; }
    if (orangeVal) { orangeVal.innerText = "INACTIVE"; orangeVal.className = "hud-value"; }
    
    // Clear crosshair glow
    document.getElementById('crosshair-left').classList.remove('active');
    document.getElementById('crosshair-right').classList.remove('active');

    // Reset tracking HUD
    const hudTrackBlue = document.getElementById('hud-tracking-blue');
    const hudTrackOrange = document.getElementById('hud-tracking-orange');
    if (hudTrackBlue) hudTrackBlue.style.display = 'none';
    if (hudTrackOrange) hudTrackOrange.style.display = 'none';

    // Clean up previous level lights
    levelLights.forEach(light => scene.remove(light));
    levelLights = [];

    // Clean up previous level objects
    colliders.forEach(c => {
        if (c.userData.mesh) {
            scene.remove(c.userData.mesh);
            c.userData.mesh.geometry.dispose();
            c.userData.mesh.material.dispose();
        }
    });
    colliders = [];

    if (companionCube) {
        scene.remove(companionCube.mesh);
        companionCube = null;
    }
    if (floorButton) {
        scene.remove(floorButton.parent); // removes whole button group
        floorButton = null;
    }
    if (elevatorDoor) {
        scene.remove(elevatorDoor);
        elevatorDoor = null;
    }
    if (elevatorRoomGroup) {
        elevatorRoomGroup.traverse(child => {
            if (child.isMesh) {
                child.geometry.dispose();
                if (child.material && child.material.dispose) child.material.dispose();
            }
        });
        scene.remove(elevatorRoomGroup);
        elevatorRoomGroup = null;
    }
    if (acidMesh) {
        scene.remove(acidMesh);
        acidMesh = null;
    }
    if (fizzlerMesh) {
        scene.remove(fizzlerMesh);
        fizzlerMesh = null;
    }

    // Reset Portals
    portals.blue.active = false;
    portals.blue.mesh.visible = false;
    portals.orange.active = false;
    portals.orange.mesh.visible = false;

    // Load new level layout
    const level = levels[index];
    document.getElementById('hud-status').innerText = `CHAMBER ${index + 1}`;
    
    // Build level architecture
    level.setup(scene, colliders, levelLights);

    // Track acid reference
    scene.children.forEach(child => {
        if (child.name === "acid") {
            acidMesh = child;
        }
    });

    // Setup Companion Cube
    if (level.cubeSpawn) {
        companionCubeSpawnPos.copy(level.cubeSpawn);
        const cubeMesh = companionCubeGLB ? companionCubeGLB.clone() : createCompanionCubeMesh();
        cubeMesh.position.copy(level.cubeSpawn);
        scene.add(cubeMesh);

        companionCube = {
            mesh: cubeMesh,
            position: cubeMesh.position,
            velocity: new THREE.Vector3(),
            radius: 0.65,
            isHeld: false,
            prevPosition: level.cubeSpawn.clone()
        };
    }

    // Interactive Button, Fizzler, Door
    createButtonAndDoor(level);

    // Setup player position
    player.position.copy(level.playerSpawn);
    player.velocity.set(0, 0, 0);
    player.yaw = Math.PI; // Look forward
    player.pitch = 0;
    player.prevPosition.copy(player.position);
    player.holding = null;

    // Screen Fade In
    const overlay = document.getElementById('overlay-screen');
    overlay.style.opacity = '0';
    setTimeout(() => overlay.style.display = 'none', 500);

    // Play GLaDOS vocal track queue
    queueDialogs(level.dialogs.filter(d => d.trigger === 'start'));
}

function handleLevelComplete() {
    if (levelComplete) return;
    levelComplete = true;
    isMovingElevator = true;
    sfx.playLevelComplete();
    
    // Play elevator audio hum
    elevatorHumSound = sfx.playElevatorHum();

    // Trigger typewriter subtitle
    const level = levels[currentLevelIndex];
    queueDialogs(level.dialogs.filter(d => d.trigger === 'complete'));

    // Fade to black overlay screen
    const overlay = document.getElementById('overlay-screen');
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';

    // Slide elevator doors shut
    const doorCol = colliders.find(c => c.userData.door);
    if (doorCol) {
        doorCol.userData.openY = 0;
    }

    setTimeout(() => {
        // Stop hum
        if (elevatorHumSound) {
            elevatorHumSound.stop();
        }

        // Proceed to next level
        if (currentLevelIndex + 1 < levels.length) {
            loadLevel(currentLevelIndex + 1);
        } else {
            triggerVictoryScreen();
        }
    }, 4500);
}

function triggerVictoryScreen() {
    gameFinished = true;
    document.exitPointerLock();
    
    if (!isPaused) {
        totalPlayTime += clock.getElapsedTime() - lastUnpauseTime;
    }
    const elapsed = Math.floor(totalPlayTime);
    document.getElementById('stat-time').innerText = elapsed;
    document.getElementById('stat-portals').innerText = portalsFired;
    
    document.getElementById('menu-start').style.display = 'none';
    document.getElementById('menu-victory').style.display = 'block';
    
    showSubtitle("TEST CHAMBERS CLEARED. APERTURE SCIENCE CONGRATULATES YOU ON REMAINING ALIVE.");
}

// ----------------- Player input movement physics -----------------
const walkDir = new THREE.Vector3();
function updatePlayer(dt) {
    if (isMovingElevator || gameFinished) return;

    // 1. Process movement inputs relative to yaw
    let moveX = 0;
    let moveZ = 0;
    if (keys.w) moveZ = -1;
    if (keys.s) moveZ = 1;
    if (keys.a) moveX = -1;
    if (keys.d) moveX = 1;

    const dirX = Math.sin(player.yaw);
    const dirZ = Math.cos(player.yaw);

    walkDir.set(0, 0, 0);
    if (moveZ !== 0) {
        walkDir.x += dirX * moveZ;
        walkDir.z += dirZ * moveZ;
    }
    if (moveX !== 0) {
        walkDir.x += dirZ * moveX;
        walkDir.z -= dirX * moveX;
    }
    walkDir.normalize();

    // Horizontal speed & momentum preservation
    if (player.onGround) {
        player.velocity.x = walkDir.x * player.speed;
        player.velocity.z = walkDir.z * player.speed;
    } else {
        // Air control: allow player to steer slightly in the air
        const airControl = 4.0; // acceleration in m/s^2
        player.velocity.x += walkDir.x * airControl * dt;
        player.velocity.z += walkDir.z * airControl * dt;
        
        // Drag in the air (very minimal)
        player.velocity.x *= Math.pow(0.98, dt * 60);
        player.velocity.z *= Math.pow(0.98, dt * 60);
    }

    // 2. Footsteps Sound timing
    if (player.onGround && (moveX !== 0 || moveZ !== 0)) {
        stepTimer += dt;
        if (stepTimer > 0.4) {
            sfx.playStep();
            stepTimer = 0;
        }
    }

    // 3. Handle Jump
    if (keys.space && player.onGround) {
        player.velocity.y = player.jumpStrength;
        player.onGround = false;
        sfx.playRelease(); // small launch sound
    }

    const prevOnGround = player.onGround;

    // 4. Run Physics update (sliding colliders and gravity)
    let cubeCollider = null;
    if (companionCube && !companionCube.isHeld) {
        cubeCollider = new THREE.Box3().setFromObject(companionCube.mesh);
        cubeCollider.userData = { wallId: 'cube' };
        colliders.push(cubeCollider);
    }

    handlePhysics(player, colliders, dt, 24, false);

    if (cubeCollider) {
        colliders.pop(); // remove temporary cube collider
    }

    // Landed sound
    if (player.onGround && !prevOnGround) {
        sfx.playLanding();
    }

    // 5. Teleport check
    checkTeleportation(player, portals, camera, false);



    // 7. Check elevator exit transition
    const currentLevel = levels[currentLevelIndex];
    const distElevator = player.position.distanceTo(currentLevel.elevatorPos);
    if (distElevator < 1.3 && player.position.y < currentLevel.elevatorPos.y + 1.2 && !levelComplete) {
        handleLevelComplete();
    }
}

// ----------------- Portal Gun sway bobbing simulation -----------------
function updateGunSway() {
    if (!portalGun) return;
    
    // Attach weapon directly in front of camera
    portalGun.position.copy(camera.position);
    portalGun.quaternion.copy(camera.quaternion);

    // Bobbing sway based on player speed
    const horizSpeed = Math.sqrt(player.velocity.x * player.velocity.x + player.velocity.z * player.velocity.z);
    const time = horizSpeed > 0.4 ? clock.getElapsedTime() * 11 : 0;

    const swayX = Math.sin(time) * 0.016;
    const swayY = Math.abs(Math.cos(time)) * 0.012 - 0.22;

    // Offset relative to weapon axes
    portalGun.translateOnAxis(new THREE.Vector3(1, 0, 0), 0.22 + swayX);
    portalGun.translateOnAxis(new THREE.Vector3(0, 1, 0), swayY);
    portalGun.translateOnAxis(new THREE.Vector3(0, 0, -1), 0.48);
}

// ----------------- Core Engine Initialization -----------------
function init() {
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile) {
        document.body.classList.add('is-mobile-device');
    }
    const container = document.getElementById('canvas-container');
    
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080a0f, 0.016);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    
    renderer = new THREE.WebGLRenderer({ antialias: !isMobile });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(isMobile ? 1.0 : Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = !isMobile;
    if (!isMobile) {
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    container.appendChild(renderer.domElement);

    clock = new THREE.Clock();


    // Ambient Lighting — kept low so dark concrete walls stay dark
    const ambient = new THREE.AmbientLight(0xffffff, 0.18);
    scene.add(ambient);

    // Hemisphere Light — cool sky top, dark floor bounce
    const hemiLight = new THREE.HemisphereLight(0xc8d8ff, 0x202020, 0.28);
    scene.add(hemiLight);

    // Directional key light — reduced so white walls don't blow out
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.75);
    sunLight.position.set(5, 20, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // Local portal chamber lighting (cool Aperture lab accent light)
    const localLight = new THREE.PointLight(0x00bcff, 0.45, 28);
    localLight.position.set(0, 8, 0);
    scene.add(localLight);

    // Initialize systems
    initPortals();
    portalGun = createPortalGunMesh();
    scene.add(portalGun);

    // Attempt to load GLB model for companion cube
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('./companion_cube.glb',
        (gltf) => {
            companionCubeGLB = gltf.scene;
            companionCubeGLB.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            // Auto scale to 1.2 units bounding box
            const box = new THREE.Box3().setFromObject(companionCubeGLB);
            const size = new THREE.Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            if (maxDim > 0) {
                const scale = 1.2 / maxDim;
                companionCubeGLB.scale.set(scale, scale, scale);
            }
            console.log("Companion Cube GLB model loaded successfully.");
            
            // Immediately swap the procedural cube mesh if it's already active in the level
            if (companionCube && companionCube.mesh) {
                const spawnPos = companionCube.mesh.position.clone();
                const spawnRot = companionCube.mesh.rotation.clone();
                scene.remove(companionCube.mesh);
                
                const newMesh = companionCubeGLB.clone();
                newMesh.position.copy(spawnPos);
                newMesh.rotation.copy(spawnRot);
                scene.add(newMesh);
                companionCube.mesh = newMesh;
                companionCube.position = newMesh.position;
            }
        },
        undefined,
        (error) => {
            console.warn("Could not load './companion_cube.glb' (falling back to procedural companion cube mesh):", error);
        }
    );


    // Setup input listeners
    setupInputListeners();
    setupMobileControls();

    // Start with Chamber 01
    loadLevel(0);

    // Start tick loop
    animate();
}

function animate() {
    requestAnimationFrame(animate);

    if (isPaused) {
        // Render static frame
        renderer.setRenderTarget(null);
        renderer.render(scene, camera);
        return;
    }

    const dt = Math.min(clock.getDelta(), 0.08); // cap step delta to prevent clipping
    const totalTime = clock.getElapsedTime();

    // 1. Update entities
    updatePlayer(dt);

    if (companionCube && !companionCube.isHeld) {
        // Temporarily add player's bounding box to colliders so the cube collides with and can be pushed by the player
        const playerCollider = new THREE.Box3();
        playerCollider.min.set(player.position.x - 0.6, player.position.y - 0.9, player.position.z - 0.6);
        playerCollider.max.set(player.position.x + 0.6, player.position.y + 0.9, player.position.z + 0.6);
        playerCollider.userData = { wallId: 'player' };
        colliders.push(playerCollider);

        const prevCubeOnGround = companionCube.mesh.userData.onGround;
        handlePhysics(companionCube, colliders, dt, 24, true);

        colliders.pop(); // remove player collider

        // Landing sound
        if (companionCube.mesh.userData.onGround && !prevCubeOnGround && companionCube.velocity.y < -2) {
            sfx.playLanding();
        }

        checkTeleportation(companionCube, portals, camera, true);
    }

    // Safety out-of-bounds check (if player falls into the void)
    const level = levels[currentLevelIndex];
    if (level && (player.position.y < -15 || Math.abs(player.position.x) > 35 || Math.abs(player.position.z) > 35)) {
        player.position.copy(level.playerSpawn);
        player.velocity.set(0, 0, 0);
        showSubtitle("OUT OF BOUNDS DETECTED. SPAWN PROTOCOL ENGAGED.");
    }

    // Safety for companion cube
    if (companionCube && !companionCube.isHeld) {
        if (companionCube.mesh.position.y < -15 || Math.abs(companionCube.mesh.position.x) > 35 || Math.abs(companionCube.mesh.position.z) > 35) {
            companionCube.mesh.position.copy(companionCubeSpawnPos);
            companionCube.velocity.set(0, 0, 0);
        }
    }

    updateHeldObject(dt);
    updateInteractiveElements();
    updateGunSway();

    // Recoil recovery
    if (portalGun) {
        portalGun.position.z = THREE.MathUtils.lerp(portalGun.position.z, 0, 0.1);
    }



    // Animate tracer lines
    firingLines = firingLines.filter(line => {
        const age = totalTime - line.time;
        if (age > 0.12) {
            scene.remove(line.mesh);
            line.mesh.geometry.dispose();
            line.mesh.material.dispose();
            return false;
        }
        line.mesh.material.opacity = 1.0 - (age / 0.12);
        return true;
    });

    // Particle dynamics
    particles = particles.filter(p => {
        const age = totalTime - p.userData.birth;
        if (age > 0.8) {
            scene.remove(p);
            p.geometry.dispose();
            p.material.dispose();
            return false;
        }
        p.position.addScaledVector(p.userData.vel, dt);
        p.userData.vel.y -= 9.8 * dt; // particle gravity
        p.scale.multiplyScalar(0.96); // shrink
        return true;
    });

    // Sync camera orientations from yaw/pitch variables immediately
    camera.rotation.set(0, 0, 0);
    camera.quaternion.setFromEuler(new THREE.Euler(player.pitch, player.yaw, 0, 'YXZ'));
    camera.position.copy(player.position);
    camera.updateMatrixWorld(true);

    // Force update portal mesh matrices
    portals.blue.mesh.updateMatrixWorld(true);
    portals.orange.mesh.updateMatrixWorld(true);
    if (companionCube) companionCube.mesh.updateMatrixWorld(true);

    // Update portal shader uniforms
    const bothActive = portals.blue.active && portals.orange.active;
    const blueDiscMat = portals.blue.viewMesh.material;
    const orangeDiscMat = portals.orange.viewMesh.material;
    blueDiscMat.uniforms.uConnected.value = bothActive ? 1.0 : 0.0;
    orangeDiscMat.uniforms.uConnected.value = bothActive ? 1.0 : 0.0;
    blueDiscMat.uniforms.uTime.value = totalTime;
    orangeDiscMat.uniforms.uTime.value = totalTime;

    // Update portal tracking HUD
    updatePortalTrackingHUD();

    // 2. Rendering pipeline - Render Portal Views
    renderPortals();
    // Render directly to screen
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
}

// ----------------- Controls & Input Bindings -----------------
function setupInputListeners() {
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    // Start button
    const startBtn = document.getElementById('btn-start');
    const restartBtn = document.getElementById('btn-restart');
    const overlay = document.getElementById('overlay-screen');

    const setStartBtnText = (txt) => {
        const btnTextEl = startBtn.querySelector('.btn-text');
        if (btnTextEl) {
            btnTextEl.innerText = txt;
        } else {
            startBtn.innerText = txt;
        }
    };

    startBtn.addEventListener('click', () => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.style.display = 'none', 500);
        if (!isMobile) {
            document.body.requestPointerLock();
        }
        if (isPaused) {
            lastUnpauseTime = clock.getElapsedTime();
        } else {
            totalPlayTime = 0;
            lastUnpauseTime = clock.getElapsedTime();
        }
        isPaused = false;
        sfx.init();
        startTime = clock.getElapsedTime();
        showSubtitle("TEST CHAMBERS COMMENCED. PORTAL MECHANISM ONLINE.");
        
        // Sync pause button UI
        const pauseBtn = document.getElementById('menu-btn-pause');
        if (pauseBtn) {
            pauseBtn.querySelector('.icon-pause').style.display = 'inline-block';
            pauseBtn.querySelector('.icon-play').style.display = 'none';
            pauseBtn.querySelector('span').innerText = 'Pause';
        }
    });

    restartBtn.addEventListener('click', () => {
        location.reload();
    });

    // Pointer Lock Change listener (handle Esc key press and clicks)
    document.addEventListener('pointerlockchange', () => {
        if (isMobile) return;
        if (document.pointerLockElement === document.body) {
            mouseLocked = true;
            overlay.style.display = 'none';
            isPaused = false;
            lastUnpauseTime = clock.getElapsedTime();
            
            // Sync pause button UI
            const pauseBtn = document.getElementById('menu-btn-pause');
            if (pauseBtn) {
                pauseBtn.querySelector('.icon-pause').style.display = 'inline-block';
                pauseBtn.querySelector('.icon-play').style.display = 'none';
                pauseBtn.querySelector('span').innerText = 'Pause';
            }
        } else {
            mouseLocked = false;
            // Only show menu if the level is not transitioning or completed
            if (!levelComplete && !gameFinished) {
                overlay.style.display = 'flex';
                overlay.style.opacity = '1';
                setStartBtnText("Resume Test Protocol");
                keys.w = keys.s = keys.a = keys.d = keys.space = false;
                totalPlayTime += clock.getElapsedTime() - lastUnpauseTime;
                isPaused = true;
                
                // Sync pause button UI
                const pauseBtn = document.getElementById('menu-btn-pause');
                if (pauseBtn) {
                    pauseBtn.querySelector('.icon-pause').style.display = 'none';
                    pauseBtn.querySelector('.icon-play').style.display = 'inline-block';
                    pauseBtn.querySelector('span').innerText = 'Resume';
                }
            }
        }
    });

    // Pause button click handler
    const pauseBtn = document.getElementById('menu-btn-pause');
    if (pauseBtn) {
        pauseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (levelComplete || gameFinished) return;
            
            isPaused = !isPaused;
            if (isPaused) {
                overlay.style.display = 'flex';
                overlay.style.opacity = '1';
                setStartBtnText("Resume Test Protocol");
                pauseBtn.querySelector('.icon-pause').style.display = 'none';
                pauseBtn.querySelector('.icon-play').style.display = 'inline-block';
                pauseBtn.querySelector('span').innerText = 'Resume';
                keys.w = keys.s = keys.a = keys.d = keys.space = false;
                totalPlayTime += clock.getElapsedTime() - lastUnpauseTime;
                if (!isMobile && document.pointerLockElement === document.body) {
                    document.exitPointerLock();
                }
            } else {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.style.display = 'none', 500);
                pauseBtn.querySelector('.icon-pause').style.display = 'inline-block';
                pauseBtn.querySelector('.icon-play').style.display = 'none';
                pauseBtn.querySelector('span').innerText = 'Pause';
                lastUnpauseTime = clock.getElapsedTime();
                if (!isMobile) {
                    document.body.requestPointerLock();
                }
            }
        });
    }

    // Sound button click handler
    const soundBtn = document.getElementById('menu-btn-sound');
    if (soundBtn) {
        soundBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sfx.toggle();
        });
    }

    // Exit button click handler
    const exitBtn = document.getElementById('menu-btn-exit');
    if (exitBtn) {
        exitBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm("Exit Chamber and return to projects hub?")) {
                location.href = '../../index.html';
            }
        });
    }
    // Window resize
    window.addEventListener('resize', () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
        const pr = isMobile ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.5);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        renderer.setPixelRatio(isMobile ? 1.0 : Math.min(window.devicePixelRatio, 1.5));
        // Keep portal render targets in sync with screen size
        if (renderTargetBlue) renderTargetBlue.setSize(w * pr, h * pr);
        if (renderTargetOrange) renderTargetOrange.setSize(w * pr, h * pr);
        if (pCameraBlue) { pCameraBlue.aspect = w / h; pCameraBlue.updateProjectionMatrix(); }
        if (pCameraOrange) { pCameraOrange.aspect = w / h; pCameraOrange.updateProjectionMatrix(); }
    });

    // Keyboard bindings
    window.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();
        if (k === 'w') keys.w = true;
        if (k === 's') keys.s = true;
        if (k === 'a') keys.a = true;
        if (k === 'd') keys.d = true;
        if (k === ' ' || k === 'spacebar') keys.space = true;
        if (k === 'e' || k === 'f') tryGrabObject();
    });

    window.addEventListener('keyup', (e) => {
        const k = e.key.toLowerCase();
        if (k === 'w') keys.w = false;
        if (k === 's') keys.s = false;
        if (k === 'a') keys.a = false;
        if (k === 'd') keys.d = false;
        if (k === ' ' || k === 'spacebar') keys.space = false;
    });

    // Mouse looking
    document.body.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement !== document.body) return;
        
        player.yaw -= e.movementX * 0.0022;
        player.pitch -= e.movementY * 0.0022;
        // Cap pitch to prevent upside down flips
        player.pitch = Math.max(-Math.PI/2 + 0.05, Math.min(Math.PI/2 - 0.05, player.pitch));
    });

    // Mouse Portal firing / locking click
    window.addEventListener('mousedown', (e) => {
        if (isMobile) return;
        if (document.pointerLockElement !== document.body) {
            // Re-lock if menu is hidden and user clicked the canvas
            if (overlay.style.display === 'none' && !levelComplete && !gameFinished) {
                document.body.requestPointerLock();
            }
            return;
        }
        if (e.button === 0) tryFirePortal(true);  // Left -> Blue
        if (e.button === 2) tryFirePortal(false); // Right -> Orange
    });

    window.addEventListener('contextmenu', e => e.preventDefault());
}

// ----------------- Touch controls for Mobile -----------------
function setupMobileControls() {
    const joy = document.getElementById('joystick');
    const handle = document.getElementById('joystick-handle');
    
    if (!joy || !handle) return;

    const touchState = { active: false };
    let joyTouchId = null;
    let joyRect = null;
    let joyCenterX = 0;
    let joyCenterY = 0;

    const updateJoystick = (touch) => {
        const dx = touch.clientX - joyCenterX;
        const dy = touch.clientY - joyCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const handleRadius = handle.offsetWidth / 2 || 27;
        const maxDist = joyRect ? (joyRect.width / 2 - handleRadius) : 38;
        const dist = Math.min(maxDist, distance);
        const angle = Math.atan2(dy, dx);

        const hX = Math.cos(angle) * dist;
        const hY = Math.sin(angle) * dist;

        handle.style.transform = `translate(calc(-50% + ${hX}px), calc(-50% + ${hY}px))`;

        const threshold = 12;
        keys.w = hY < -threshold;
        keys.s = hY > threshold;
        keys.a = hX < -threshold;
        keys.d = hX > threshold;
    };

    joy.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        joyTouchId = touch.identifier;
        touchState.active = true;
        joyRect = joy.getBoundingClientRect();
        joyCenterX = joyRect.left + joyRect.width / 2;
        joyCenterY = joyRect.top + joyRect.height / 2;
        updateJoystick(touch);
    }, { passive: false });

    joy.addEventListener('touchmove', (e) => {
        if (!touchState.active) return;
        e.preventDefault();
        let touch = null;
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === joyTouchId) {
                touch = e.touches[i];
                break;
            }
        }
        if (!touch) return;
        updateJoystick(touch);
    }, { passive: false });

    const endJoystick = (e) => {
        if (!touchState.active) return;
        let joyEnded = false;
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === joyTouchId) {
                joyEnded = true;
                break;
            }
        }
        if (!joyEnded) return;

        touchState.active = false;
        joyTouchId = null;
        handle.style.transform = 'translate(-50%, -50%)';
        keys.w = keys.s = keys.a = keys.d = false;
    };
    joy.addEventListener('touchend', endJoystick, { passive: true });
    joy.addEventListener('touchcancel', endJoystick, { passive: true });

    // Touch swipe camera looking (right side of screen)
    let camTouchId = null;
    let lastCamX = 0;
    let lastCamY = 0;

    window.addEventListener('touchstart', (e) => {
        if (isPaused || gameFinished || levelComplete) return;
        if (camTouchId !== null) return;

        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            if (touch.clientX > window.innerWidth / 2) {
                // Ignore if touch started on menu elements or action buttons to prevent camera jumps
                if (
                    touch.target.classList.contains('m-btn') || 
                    touch.target.closest('.mobile-btn-container') ||
                    touch.target.closest('.game-menu-bar') ||
                    touch.target.closest('.menu-box')
                ) {
                    continue;
                }
                camTouchId = touch.identifier;
                lastCamX = touch.clientX;
                lastCamY = touch.clientY;
                break;
            }
        }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (isPaused || gameFinished || levelComplete) return;
        let isCamTouch = false;
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            if (touch.identifier === camTouchId) {
                isCamTouch = true;
                const dx = touch.clientX - lastCamX;
                const dy = touch.clientY - lastCamY;
                
                player.yaw -= dx * 0.005;
                player.pitch -= dy * 0.005;
                player.pitch = Math.max(-Math.PI/2 + 0.05, Math.min(Math.PI/2 - 0.05, player.pitch));

                lastCamX = touch.clientX;
                lastCamY = touch.clientY;
            }
        }
        if (isCamTouch) {
            e.preventDefault();
        }
    }, { passive: false });

    const endCameraTouch = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === camTouchId) {
                camTouchId = null;
                break;
            }
        }
    };
    window.addEventListener('touchend', endCameraTouch, { passive: true });
    window.addEventListener('touchcancel', endCameraTouch, { passive: true });

    // Mobile Actions - Trigger instantly on touchstart/mousedown to eliminate 300ms click delay
    const bindMobileBtn = (id, actionFn) => {
        const el = document.getElementById(id);
        if (!el) return;
        const trigger = (e) => {
            e.preventDefault();
            actionFn();
        };
        el.addEventListener('touchstart', trigger, { passive: false });
        el.addEventListener('mousedown', trigger);
    };

    bindMobileBtn('m-btn-blue', () => tryFirePortal(true));
    bindMobileBtn('m-btn-orange', () => tryFirePortal(false));
    bindMobileBtn('m-btn-grab', () => tryGrabObject());
    
    const jumpBtn = document.getElementById('m-btn-jump');
    if (jumpBtn) {
        const pressJump = (e) => {
            e.preventDefault();
            keys.space = true;
        };
        const releaseJump = (e) => {
            e.preventDefault();
            keys.space = false;
        };
        jumpBtn.addEventListener('touchstart', pressJump, { passive: false });
        jumpBtn.addEventListener('touchend', releaseJump);
        jumpBtn.addEventListener('touchcancel', releaseJump);
        jumpBtn.addEventListener('mousedown', pressJump);
        jumpBtn.addEventListener('mouseup', releaseJump);
        jumpBtn.addEventListener('mouseleave', releaseJump);
    }
}

// ----------------- Initialization Trigger -----------------
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
} else {
    document.addEventListener('DOMContentLoaded', init);
}
export { player, portals, companionCube, colliders };
