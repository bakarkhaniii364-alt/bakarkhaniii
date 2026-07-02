import * as THREE from 'three';

function isInsidePortal(entityPos, portal) {
    if (!portal || !portal.active) return false;
    const vecToEntity = entityPos.clone().sub(portal.position);
    const distToPlane = Math.abs(vecToEntity.dot(portal.normal));
    if (distToPlane > 1.5) return false;
    
    const srcMesh = portal.mesh;
    const localX = new THREE.Vector3(1, 0, 0).applyQuaternion(srcMesh.quaternion);
    const localY = new THREE.Vector3(0, 1, 0).applyQuaternion(srcMesh.quaternion);
    const projX = vecToEntity.dot(localX);
    const projY = vecToEntity.dot(localY);
    // Use 1.4 to allow a slightly larger bypass boundary than the teleport threshold of 1.25
    return (projX * projX) / (0.8 * 0.8) + (projY * projY) / (1.6 * 1.6) <= 1.4;
}

export function handlePhysics(entity, colliders, dt, gravity, isCube = false) {
    // 1. Apply gravity to velocity
    entity.velocity.y -= gravity * dt;
    
    // Cap vertical velocity to avoid falling through walls
    const maxFallSpeed = 40;
    if (entity.velocity.y < -maxFallSpeed) {
        entity.velocity.y = -maxFallSpeed;
    }

    // Active portal wall bypasses (allow player/cube to pass through portals without colliding with walls)
    const activeWallBypasses = [];
    if (window.portals && window.portals.blue && window.portals.blue.active) activeWallBypasses.push(window.portals.blue.wallId);
    if (window.portals && window.portals.orange && window.portals.orange.active) activeWallBypasses.push(window.portals.orange.wallId);

    const radius = isCube ? entity.radius : 0.6;
    const halfHeight = isCube ? 0.6 : 0.9;

    // Axis X Resolution
    entity.position.x += entity.velocity.x * dt;
    resolveAxisCollisions('x', entity, colliders, radius, halfHeight, activeWallBypasses);

    // Axis Y Resolution
    entity.position.y += entity.velocity.y * dt;
    const hitGround = resolveAxisCollisions('y', entity, colliders, radius, halfHeight, activeWallBypasses);
    
    if (!isCube) {
        entity.onGround = hitGround.bottom;
        if (entity.onGround) {
            entity.velocity.y = 0;
        }
        if (hitGround.top && entity.velocity.y > 0) {
            entity.velocity.y = 0; // stop upward movement on head bonk
        }
    } else {
        if (hitGround.bottom) {
            entity.velocity.y = 0;
            // Friction for sliding cubes
            entity.velocity.x *= 0.8;
            entity.velocity.z *= 0.8;
        }
        if (hitGround.top && entity.velocity.y > 0) {
            entity.velocity.y = 0;
        }
    }

    // Axis Z Resolution
    entity.position.z += entity.velocity.z * dt;
    resolveAxisCollisions('z', entity, colliders, radius, halfHeight, activeWallBypasses);
}

function resolveAxisCollisions(axis, entity, colliders, radius, halfHeight, activeWallBypasses) {
    let hitResult = { top: false, bottom: false, wall: false };

    let eMin = { x: entity.position.x - radius, y: entity.position.y - halfHeight, z: entity.position.z - radius };
    let eMax = { x: entity.position.x + radius, y: entity.position.y + halfHeight, z: entity.position.z + radius };

    for (const box of colliders) {
        // If this wall is portalable and has an active portal, bypass collision if inside the portal ellipse
        if (box.userData && box.userData.wallId && activeWallBypasses.includes(box.userData.wallId)) {
            let bypass = false;
            if (window.portals.blue.active && window.portals.blue.wallId === box.userData.wallId) {
                if (isInsidePortal(entity.position, window.portals.blue)) bypass = true;
            }
            if (window.portals.orange.active && window.portals.orange.wallId === box.userData.wallId) {
                if (isInsidePortal(entity.position, window.portals.orange)) bypass = true;
            }
            
            if (bypass) {
                continue; // Pass through the portal
            }
        }

        // Ignore open doors
        if (box.userData.door && box.userData.openY > 0) continue;

        const bMin = box.min;
        const bMax = box.max;

        // Check overlap
        if (eMin.x < bMax.x && eMax.x > bMin.x &&
            eMin.y < bMax.y && eMax.y > bMin.y &&
            eMin.z < bMax.z && eMax.z > bMin.z) {
            
            if (axis === 'x') {
                const overlapL = bMax.x - eMin.x;
                const overlapR = eMax.x - bMin.x;
                if (overlapL < overlapR) {
                    entity.position.x += overlapL + 0.001; // push right
                } else {
                    entity.position.x -= overlapR + 0.001; // push left
                }
                entity.velocity.x = 0;
                hitResult.wall = true;
            } else if (axis === 'y') {
                const overlapB = bMax.y - eMin.y; // push up
                const overlapT = eMax.y - bMin.y; // push down
                if (overlapB < overlapT) {
                    entity.position.y += overlapB + 0.001;
                    hitResult.bottom = true;
                } else {
                    entity.position.y -= overlapT + 0.001;
                    hitResult.top = true;
                }
            } else if (axis === 'z') {
                const overlapF = bMax.z - eMin.z;
                const overlapB = eMax.z - bMin.z;
                if (overlapF < overlapB) {
                    entity.position.z += overlapF + 0.001; // push forward
                } else {
                    entity.position.z -= overlapB + 0.001; // push back
                }
                entity.velocity.z = 0;
                hitResult.wall = true;
            }
            
            // Re-calculate bounds for subsequent checks
            eMin = { x: entity.position.x - radius, y: entity.position.y - halfHeight, z: entity.position.z - radius };
            eMax = { x: entity.position.x + radius, y: entity.position.y + halfHeight, z: entity.position.z + radius };
        }
    }
    return hitResult;
}

export function checkTeleportation(entity, portals, camera, isCube = false) {
    if (!portals.blue.active || !portals.orange.active) return false;

    const portalsList = [
        { src: portals.blue, dst: portals.orange },
        { src: portals.orange, dst: portals.blue }
    ];

    const entityPos = entity.position.clone();
    
    // Initialize prevPosition if missing
    if (!entity.prevPosition) {
        entity.prevPosition = entityPos.clone();
        return false;
    }
    
    const prevPos = entity.prevPosition.clone();
    entity.prevPosition = entityPos.clone(); // store current pos for next frame

    for (const p of portalsList) {
        const vecToEntity = entityPos.clone().sub(p.src.position);
        const dist = vecToEntity.dot(p.src.normal);

        // Project entity onto portal surface plane
        const srcMesh = p.src.mesh;
        const localX = new THREE.Vector3(1, 0, 0).applyQuaternion(srcMesh.quaternion);
        const localY = new THREE.Vector3(0, 1, 0).applyQuaternion(srcMesh.quaternion);

        const projX = vecToEntity.dot(localX);
        const projY = vecToEntity.dot(localY);

        // Elliptical shape check (portal bounds: 0.8m width radius, 1.6m height radius)
        const inEllipse = (projX * projX) / (0.8 * 0.8) + (projY * projY) / (1.6 * 1.6) <= 1.25;

        if (inEllipse) {
            const vecPrevToEntity = prevPos.clone().sub(p.src.position);
            const prevDist = vecPrevToEntity.dot(p.src.normal);

            // True crossing check: must go from front (positive dist) to back (negative dist)
            // or be extremely close and moving into the portal plane (prevDist > dist)
            const crossed = prevDist >= -0.02 && dist < 0.05 && (prevDist - dist) > 0.001;

            if (crossed) {
                // Compute matrix to transform from source portal to destination portal
                const flipRotation = new THREE.Matrix4().makeRotationY(Math.PI);
                const srcToDst = new THREE.Matrix4()
                    .copy(p.src.mesh.matrixWorld).invert()
                    .premultiply(flipRotation)
                    .premultiply(p.dst.mesh.matrixWorld);

                // Teleport position
                const newPos = entity.position.clone().applyMatrix4(srcToDst);
                entity.position.copy(newPos);
                
                // Push the entity out of the destination portal along its normal (0.15m is enough to clear threshold)
                entity.position.addScaledVector(p.dst.normal, 0.15);

                // Teleport velocity (rotate momentum vector)
                const rotQuat = new THREE.Quaternion().setFromRotationMatrix(srcToDst);
                entity.velocity.applyQuaternion(rotQuat);

                if (!isCube) {
                    // Update player viewing angles
                    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
                    forward.applyQuaternion(rotQuat);
                    
                    entity.yaw = Math.atan2(-forward.x, -forward.z);
                    const groundDist = Math.sqrt(forward.x * forward.x + forward.z * forward.z);
                    entity.pitch = Math.atan2(forward.y, groundDist);

                    // Sync camera immediately
                    camera.rotation.set(0, 0, 0);
                    camera.quaternion.setFromEuler(new THREE.Euler(entity.pitch, entity.yaw, 0, 'YXZ'));
                    camera.position.copy(entity.position);
                } else {
                    // Drop cube if it's currently held
                    if (window.player && window.player.holding === entity) {
                        window.dropHeldObject();
                    }
                }

                // Update prevPosition to the new pushed-out position to prevent loops
                entity.prevPosition.copy(entity.position);
                return true;
            }
        }
    }
    return false;
}
