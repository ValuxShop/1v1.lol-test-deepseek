class Physics {
    constructor() {
        this.gravity = 9.8 * 5; // Scaled for game feel
        this.worldBounds = {
            min: { x: -1000, y: 0, z: -1000 },
            max: { x: 1000, y: 1000, z: 1000 }
        };
        
        this.colliders = [];
        this.buildings = [];
    }
    
    // Axis-Aligned Bounding Box collision
    checkAABBCollision(box1, box2) {
        return (
            box1.min.x < box2.max.x &&
            box1.max.x > box2.min.x &&
            box1.min.y < box2.max.y &&
            box1.max.y > box2.min.y &&
            box1.min.z < box2.max.z &&
            box1.max.z > box2.min.z
        );
    }
    
    // Ray-AABB intersection
    raycast(origin, direction, maxDistance = 1000) {
        let closestHit = null;
        let closestDistance = maxDistance;
        
        // Check against buildings
        for (const building of this.buildings) {
            const hit = this.rayIntersectsAABB(origin, direction, building.bounds);
            if (hit && hit.distance < closestDistance) {
                closestHit = {
                    ...hit,
                    object: building,
                    type: 'building'
                };
                closestDistance = hit.distance;
            }
        }
        
        // Check against players (would be added)
        for (const player of this.colliders) {
            if (player.isActive) {
                const hit = this.rayIntersectsAABB(origin, direction, player.bounds);
                if (hit && hit.distance < closestDistance) {
                    closestHit = {
                        ...hit,
                        object: player,
                        type: 'player'
                    };
                    closestDistance = hit.distance;
                }
            }
        }
        
        return closestHit;
    }
    
    rayIntersectsAABB(origin, direction, bounds) {
        let tmin = (bounds.min.x - origin.x) / direction.x;
        let tmax = (bounds.max.x - origin.x) / direction.x;
        
        if (tmin > tmax) [tmin, tmax] = [tmax, tmin];
        
        let tymin = (bounds.min.y - origin.y) / direction.y;
        let tymax = (bounds.max.y - origin.y) / direction.y;
        
        if (tymin > tymax) [tymin, tymax] = [tymax, tymin];
        
        if ((tmin > tymax) || (tymin > tmax)) return null;
        
        if (tymin > tmin) tmin = tymin;
        if (tymax < tmax) tmax = tymax;
        
        let tzmin = (bounds.min.z - origin.z) / direction.z;
        let tzmax = (bounds.max.z - origin.z) / direction.z;
        
        if (tzmin > tzmax) [tzmin, tzmax] = [tzmax, tzmin];
        
        if ((tmin > tzmax) || (tzmin > tmax)) return null;
        
        if (tzmin > tmin) tmin = tzmin;
        if (tzmax < tmax) tmax = tzmax;
        
        if (tmax < 0) return null;
        
        const distance = tmin >= 0 ? tmin : tmax;
        if (distance < 0) return null;
        
        const point = {
            x: origin.x + direction.x * distance,
            y: origin.y + direction.y * distance,
            z: origin.z + direction.z * distance
        };
        
        // Calculate normal
        const normal = { x: 0, y: 0, z: 0 };
        const epsilon = 0.001;
        
        if (Math.abs(point.x - bounds.min.x) < epsilon) normal.x = -1;
        else if (Math.abs(point.x - bounds.max.x) < epsilon) normal.x = 1;
        else if (Math.abs(point.y - bounds.min.y) < epsilon) normal.y = -1;
        else if (Math.abs(point.y - bounds.max.y) < epsilon) normal.y = 1;
        else if (Math.abs(point.z - bounds.min.z) < epsilon) normal.z = -1;
        else if (Math.abs(point.z - bounds.max.z) < epsilon) normal.z = 1;
        
        return { distance, point, normal };
    }
    
    // Player movement collision
    resolvePlayerCollision(player, deltaTime) {
        const velocity = player.velocity;
        const position = player.position;
        const bounds = player.getBounds();
        
        // Apply gravity
       
