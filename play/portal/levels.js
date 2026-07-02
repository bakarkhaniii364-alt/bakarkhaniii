import * as THREE from 'three';

// ----------------- Procedural Grid Textures -----------------
function createGridTexture(isPortalable) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    if (isPortalable) {
        // Light concrete color panel tiles
        ctx.fillStyle = '#cfd8dc';
        ctx.fillRect(0, 0, 512, 512);
        
        // Draw panel grid (4x4 tiles)
        ctx.strokeStyle = '#78909c';
        ctx.lineWidth = 6;
        for (let i = 0; i <= 4; i++) {
            const pos = i * 128;
            ctx.beginPath();
            ctx.moveTo(pos, 0); ctx.lineTo(pos, 512);
            ctx.moveTo(0, pos); ctx.lineTo(512, pos);
            ctx.stroke();
        }
        
        // Bevel outlines inside panels for depth
        ctx.strokeStyle = '#eceff1';
        ctx.lineWidth = 2;
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 4; y++) {
                ctx.strokeRect(x * 128 + 6, y * 128 + 6, 116, 116);
            }
        }
    } else {
        // Dark metal panels (Aperture hazard walls)
        ctx.fillStyle = '#212121';
        ctx.fillRect(0, 0, 512, 512);
        
        // Thick metal framing
        ctx.strokeStyle = '#121212';
        ctx.lineWidth = 12;
        ctx.strokeRect(0, 0, 512, 512);
        
        // Draw horizontal plating seams
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 256); ctx.lineTo(512, 256);
        ctx.stroke();

        // Add metal texture scratches/grain
        ctx.fillStyle = 'rgba(255,255,255,0.02)';
        for (let i = 0; i < 30; i++) {
            ctx.fillRect(Math.random()*512, Math.random()*512, Math.random()*150, 2);
        }

        // Draw rivets along seams
        ctx.fillStyle = '#0a0a0a';
        const rivetPositions = [32, 128, 224, 320, 416, 480];
        rivetPositions.forEach(x => {
            ctx.beginPath(); ctx.arc(x, 15, 6, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(x, 271, 6, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(x, 497, 6, 0, Math.PI*2); ctx.fill();
        });
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    return texture;
}

export const portalableTexture = createGridTexture(true);
export const nonPortalableTexture = createGridTexture(false);

// Helper function to create physics-colliding walls in levels
export function buildWall(scene, colliders, w, h, d, x, y, z, rotY = 0, isPortalable = true) {
    const tex = isPortalable ? portalableTexture.clone() : nonPortalableTexture.clone();
    
    // Scale texture repeat based on size
    if (w > d) {
        tex.repeat.set(w / 4, h / 4);
    } else {
        tex.repeat.set(d / 4, h / 4);
    }

    const wallMat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: isPortalable ? 0.45 : 0.65,
        metalness: isPortalable ? 0.05 : 0.85,
        bumpMap: tex,
        bumpScale: 0.015
    });

    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, wallMat);
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotY;
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    mesh.userData = { isPortalable: isPortalable, wallId: Math.random().toString() };
    scene.add(mesh);

    mesh.updateMatrixWorld();
    const box = new THREE.Box3().setFromObject(mesh);
    box.userData = { wallId: mesh.userData.wallId, mesh: mesh };
    colliders.push(box);
    
    return mesh;
}

export const levels = [
    // ----------------- Chamber 01: Induction (Tutorial) -----------------
    {
        name: "Chamber 01",
        subtitleName: "Quantum Portal Induction",
        description: "Practice shooting portals to cross gaps and safety hazards.",
        playerSpawn: new THREE.Vector3(0, 1.2, 10),
        cubeSpawn: null,
        buttonPos: null,
        doorPos: new THREE.Vector3(0, 2.2, -10),
        acidPos: new THREE.Vector3(0, -4.5, 0),
        fizzlerPos: null,
        elevatorPos: new THREE.Vector3(0, 0.5, -13),
        dialogs: [
            { trigger: 'start', text: "Hello, and welcome back to the Aperture Science Computer-Aided Enrichment Center." },
            { trigger: 'start', text: "This level is designed to verify basic quantum gateway positioning. Please initialize portals." },
            { trigger: 'complete', text: "Excellent. Your performance has been logged as: Acceptable." }
        ],
        setup: function(scene, colliders, levelLights) {
            // Room Floor Spawn platform (light concrete tile)
            buildWall(scene, colliders, 12, 1, 8, 0, -0.5, 9, 0, true);

            // Add level point lights
            const spawnLight = new THREE.PointLight(0xe3f2fd, 1.2, 35);
            spawnLight.position.set(0, 6, 9);
            scene.add(spawnLight);
            levelLights.push(spawnLight);

            const exitLight = new THREE.PointLight(0xe3f2fd, 1.2, 35);
            exitLight.position.set(0, 6, -9);
            scene.add(exitLight);
            levelLights.push(exitLight);

            const pitLight = new THREE.PointLight(0xffffff, 0.6, 25);
            pitLight.position.set(0, -2, 0);
            scene.add(pitLight);
            levelLights.push(pitLight);

            // Exit Platform
            buildWall(scene, colliders, 12, 1, 8, 0, -0.5, -9, 0, true);

            // Bottom Floor (Portalable concrete floor)
            buildWall(scene, colliders, 30, 1, 30, 0, -5, 0, 0, true);

            // Portalable Concrete Side Wall (Left) - Extended downward to seal pit
            buildWall(scene, colliders, 1, 15, 26, -6, 2.0, 0, 0, true);

            // Non-Portalable Metal Side Wall (Right) - Extended downward to seal pit
            buildWall(scene, colliders, 1, 15, 26, 6, 2.0, 0, 0, false);

            // Back wall behind spawn - Extended downward to seal pit
            buildWall(scene, colliders, 12, 15, 1, 0, 2.0, 13, 0, true);

            // Back wall at exit - Split to leave a gap at X=0 for the elevator
            buildWall(scene, colliders, 4, 15, 1, -4, 2.0, -13, 0, false);
            buildWall(scene, colliders, 4, 15, 1, 4, 2.0, -13, 0, false);

            // Ceiling (Portalable above spawn)
            buildWall(scene, colliders, 12, 1, 26, 0, 9.5, 0, 0, true);
        }
    },

    // ----------------- Chamber 02: Weighted Storage Cube -----------------
    {
        name: "Chamber 02",
        subtitleName: "Weighted Storage Cube",
        description: "Retrieve the Companion Cube to unlock the door, but do not carry it through the Fizzler.",
        playerSpawn: new THREE.Vector3(-4, 1.2, 8),
        cubeSpawn: new THREE.Vector3(4, 1.2, -8),
        buttonPos: new THREE.Vector3(-4, 0.2, 4),
        doorPos: new THREE.Vector3(-4, 2.2, -10),
        acidPos: null,
        fizzlerPos: new THREE.Vector3(-4, 2.2, -6.5), // Fizzler in front of exit door
        elevatorPos: new THREE.Vector3(-4, 0.5, -13),
        dialogs: [
            { trigger: 'start', text: "Welcome to Chamber 02. The Aperture Science Material Emancipation Grill is active." },
            { trigger: 'start', text: "Do not attempt to smuggle testing materials out of the chamber. They will be dissolved." },
            { trigger: 'complete', text: "Outstanding. You have successfully bypassed the emancipation grid without melting the cube." }
        ],
        setup: function(scene, colliders, levelLights) {
            // Floor of main room
            buildWall(scene, colliders, 16, 1, 24, 0, -0.5, 0, 0, false);

            // Add level point lights
            const buttonLight = new THREE.PointLight(0xe3f2fd, 1.2, 30);
            buttonLight.position.set(-4, 6, 4);
            scene.add(buttonLight);
            levelLights.push(buttonLight);

            const cubeLight = new THREE.PointLight(0xe3f2fd, 1.2, 30);
            cubeLight.position.set(4, 6, -8);
            scene.add(cubeLight);
            levelLights.push(cubeLight);

            const exitLight = new THREE.PointLight(0xe3f2fd, 1.0, 30);
            exitLight.position.set(-4, 6, -11);
            scene.add(exitLight);
            levelLights.push(exitLight);

            // Ceiling
            buildWall(scene, colliders, 16, 1, 24, 0, 9.5, 0, 0, false);

            // Perimeter walls
            buildWall(scene, colliders, 1, 10, 24, -8, 4.5, 0, 0, false); // Left
            buildWall(scene, colliders, 1, 10, 24, 8, 4.5, 0, 0, false);  // Right
            buildWall(scene, colliders, 16, 10, 1, 0, 4.5, 12, 0, false); // Back (Spawn side)
            // Front wall at exit - Split to leave a gap at X=-4 for the elevator
            buildWall(scene, colliders, 2, 10, 1, -7, 4.5, -12, 0, false);
            buildWall(scene, colliders, 10, 10, 1, 3, 4.5, -12, 0, false);

            // Divider wall that splits the room: X=-8 to X=8 at Z=0.
            // Let's build it with a gap or portalable wall.
            // Left side divider: non-portalable wall with exit door corridor
            buildWall(scene, colliders, 6, 10, 1, -5, 4.5, 0, 0, false);

            // Right side divider: portalable wall, but with a tall glass window so you can see the cube room but not walk in.
            buildWall(scene, colliders, 4, 10, 1, 6, 4.5, 0, 0, true);
            
            // Glass barrier in the center (Z=0, X=-2 to X=4): blocks movement, but transparent.
            // Represented by a physical collider wall (non-portalable)
            buildWall(scene, colliders, 6, 3.5, 0.5, 1, 1.25, 0, 0, false);

            // White concrete panel inside the cube room (back wall) to fire portals onto
            buildWall(scene, colliders, 8, 10, 1, 4, 4.5, -11.9, 0, true);

            // White concrete panel in spawn room (side wall)
            buildWall(scene, colliders, 1, 6, 8, -7.9, 3, 4, 0, true);
        }
    },

    // ----------------- Chamber 03: Momentum & Flinging -----------------
    {
        name: "Chamber 03",
        subtitleName: "Momentum Preservation",
        description: "Jump from the high ledge into a floor portal to fling yourself to the exit.",
        playerSpawn: new THREE.Vector3(0, 13.2, 12),
        cubeSpawn: null,
        buttonPos: null,
        doorPos: new THREE.Vector3(0, 6.2, -12),
        acidPos: new THREE.Vector3(0, -6.5, 0),
        fizzlerPos: null,
        elevatorPos: new THREE.Vector3(0, 4.5, -15),
        dialogs: [
            { trigger: 'start', text: "Warning: High-speed gravitational testing in progress." },
            { trigger: 'start', text: "Remember: Momentum, defined as mass times velocity, is conserved. In layman's terms: speed goes in, speed comes out." },
            { trigger: 'complete', text: "Unbelievable. You have survived. Science thanks you for your cooperation." }
        ],
        setup: function(scene, colliders, levelLights) {
            // High Spawn Ledge: Z=10 to 15, Y=12. Width=10
            buildWall(scene, colliders, 8, 1, 6, 0, 11.5, 12, 0, false);

            // Add level point lights
            const spawnLedgeLight = new THREE.PointLight(0xe3f2fd, 1.5, 40);
            spawnLedgeLight.position.set(0, 17, 12);
            scene.add(spawnLedgeLight);
            levelLights.push(spawnLedgeLight);

            const exitLedgeLight = new THREE.PointLight(0xe3f2fd, 1.5, 40);
            exitLedgeLight.position.set(0, 9, -11);
            scene.add(exitLedgeLight);
            levelLights.push(exitLedgeLight);

            const pitLight = new THREE.PointLight(0xffffff, 0.9, 45);
            pitLight.position.set(0, 2, 0);
            scene.add(pitLight);
            levelLights.push(pitLight);

            // High Spawn Back Wall
            buildWall(scene, colliders, 8, 10, 1, 0, 16.5, 15, 0, false);

            // Exit Ledge (across the gap): Z=-15 to -9, Y=4.5. Width=8
            buildWall(scene, colliders, 8, 1, 6, 0, 4.0, -11, 0, false);

            // Bottom Floor (Portalable concrete floor)
            buildWall(scene, colliders, 30, 1, 40, 0, -7, 0, 0, true);

            // Target Floor Portalable Concrete Panel: directly below the spawn ledge at Z = 11, Y = -2.
            // When falling from spawn, the player drops straight into this.
            buildWall(scene, colliders, 6, 1, 6, 0, -2.5, 11, 0, true);

            // High vertical portalable concrete wall facing the exit ledge: Z = -2, X = 0, Y = 6.
            // The player shoots a portal here to fling out of it towards the exit.
            buildWall(scene, colliders, 8, 10, 1, 0, 6.5, -2, 0, true);

            // --- Momentum geometry enhancements ---
            // 1. Vertical diagonal concrete wall (portalable) rotated 45 degrees
            buildWall(scene, colliders, 1, 15, 6, -5, 7.0, 0, Math.PI / 4, true);

            // 2. Concrete pillar sitting on the bottom floor, reaching up to Y=7 (portalable)
            buildWall(scene, colliders, 3, 14, 3, 0, 0, 5, 0, true);

            // 3. High metal platform (non-portalable) at Z=-6, Y=8.5
            buildWall(scene, colliders, 4, 1, 4, 5, 8.5, -6, 0, false);

            // 4. Yellow light to illuminate the high platform
            const momentumPlatformLight = new THREE.PointLight(0xffea00, 1.2, 15);
            momentumPlatformLight.position.set(5, 11, -6);
            scene.add(momentumPlatformLight);
            levelLights.push(momentumPlatformLight);

            // Room Boundaries (ceiling at Y=22)
            buildWall(scene, colliders, 16, 30, 1, 0, 8.5, 16, 0, false); // Back
            // Front wall at exit - Split to leave a gap at X=0 for the elevator
            buildWall(scene, colliders, 6, 30, 1, -5, 8.5, -16, 0, false);
            buildWall(scene, colliders, 6, 30, 1, 5, 8.5, -16, 0, false);
            buildWall(scene, colliders, 1, 30, 32, -8, 8.5, 0, 0, false); // Left
            buildWall(scene, colliders, 1, 30, 32, 8, 8.5, 0, 0, false);  // Right

            buildWall(scene, colliders, 16, 1, 32, 0, 23.5, 0, 0, false); // Ceiling
        }
    }
];
