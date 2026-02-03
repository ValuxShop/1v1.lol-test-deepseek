class Building {
    constructor(type, position, rotation = 0, material = 'wood') {
        this.type = type;
        this.position = { ...position };
        this.rotation = rotation;
        this.material = material;
        this.health = this.getMaxHealth(material);
        this.isPlaced = false;
        
        this.updateBounds();
    }
    
    getMaxHealth(material) {
        const healthValues = {
            'wood': 150,
            'brick': 300,
            'metal': 500
        };
        return healthValues[material] || 150;
    }
    
    updateBounds() {
        const size = this.getSize();
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        
        // For simple axis-aligned bounds (rotation handled separately in placement)
        this.bounds = {
            min: {
                x: this.position.x - size.width / 2,
                y: this.position.y,
                z: this.position.z - size.depth / 2
            },
            max: {
                x: this.position.x + size.width / 2,
                y: this.position.y + size.height,
                z: this.position.z + size.depth / 2
            }
        };
    }
    
    getSize() {
        switch (this.type) {
            case 'wall':
                return { width: 1, height: 3, depth: 0.1 };
            case 'ramp':
                return { width: 2, height: 2, depth: 1 };
            case 'floor':
                return { width: 1, height: 0.1, depth: 1 };
            default:
                return { width: 1, height: 1, depth: 1 };
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            return true; // Destroyed
        }
        return false;
    }
}

class BuildSystem {
    constructor() {
        this.buildMode = false;
        this.currentBuildType = 'wall';
        this.currentMaterial = 'wood';
        this.ghostBuilding = null;
        this.canBuild = true;
        this.buildCooldown = 0;
        this.rotation = 0;
        
        this.gridSize = 1;
        this.buildRange = 10;
        this.maxBuildHeight = 10;
    }
    
    update(player, input, physics, currentTime) {
        if (!this.buildMode) return;
        
        // Rotate building
        if (input.isKeyDown('r')) {
            this.rotation = (this.rotation + Math.PI / 2) % (Math.PI * 2);
            input.keys['r'] = false; // Prevent rapid rotation
        }
        
        // Calculate build position
        const cameraPos = player.getCameraPosition();
        const forward = player.getForwardVector();
        
        // Raycast to find build position
        const hit = physics.raycast(cameraPos, forward, this.buildRange);
        
        let buildPos = null;
        if (hit && hit.type === 'building') {
            // Build adjacent to existing building
            const offset = 1.1; // Slightly away from surface
            buildPos = {
                x: hit.point.x + hit.normal.x * offset,
                y: hit.point.y + hit.normal.y * offset,
                z: hit.point.z + hit.normal.z * offset
            };
        } else {
            // Build at max range
            buildPos = {
                x: cameraPos.x + forward.x * this.buildRange,
                y: cameraPos.y + forward.y * this.buildRange,
                z: cameraPos.z + forward.z * this.buildRange
            };
        }
        
        // Snap to grid
        buildPos = this.snapToGrid(buildPos);
        
        // Check if position is valid
        const isValid = this.isValidBuildPosition(buildPos, physics, player);
        
        // Update ghost building
        if (!this.ghostBuilding || 
            this.ghostBuilding.type !== this.currentBuildType ||
            this.ghostBuilding.material !== this.currentMaterial) {
            
            this.ghostBuilding = new Building(
                this.currentBuildType,
                buildPos,
                this.rotation,
                this.currentMaterial
            );
        } else {
            this.ghostBuilding.position = buildPos;
            this.ghostBuilding.rotation = this.rotation;
            this.ghostBuilding.updateBounds();
        }
        
        this.ghostBuilding.isPlaced = false;
        this.canBuild = isValid;
        
        // Place building
        if (input.isMouseDown(0) && this.canBuild && this.buildCooldown <= currentTime) {
            if (player.materials[this.currentMaterial] > 0) {
                this.placeBuilding(player, physics, currentTime);
                this.buildCooldown = currentTime + 0.1; // 100ms cooldown
            }
        }
    }
    
    snapToGrid(position) {
        return {
            x: Math.round(position.x / this.gridSize) * this.gridSize,
            y: Math.max(0, Math.round(position.y / this.gridSize) * this.gridSize),
            z: Math.round(position.z / this.gridSize) * this.gridSize
        };
    }
    
    isValidBuildPosition(position, physics, player) {
        // Check height limit
        if (position.y > this.maxBuildHeight) return false;
        
        // Check if player is standing there
        const playerBounds = player.getBounds();
        const building = new Building(this.currentBuildType, position, this.rotation);
        
        if (physics.checkAABBCollision(playerBounds, building.bounds)) {
            return false;
        }
        
        // Check collision with existing buildings
        for (const existing of physics.buildings) {
            if (physics.checkAABBCollision(building.bounds, existing.bounds)) {
                return false;
            }
        }
        
        return true;
    }
    
    placeBuilding(player, physics, currentTime) {
        if (!this.canBuild || !this.ghostBuilding) return null;
        
        const building = new Building(
            this.currentBuildType,
            { ...this.ghostBuilding.position },
            this.rotation,
            this.currentMaterial
        );
        
        building.isPlaced = true;
        physics.addBuilding(building);
        
        // Deduct materials
        player.materials[this.currentMaterial]--;
        
        return building;
    }
    
    switchBuildType(type) {
        this.currentBuildType = type;
        this.ghostBuilding = null;
    }
    
    switchMaterial(material) {
        this.currentMaterial = material;
        this.ghostBuilding = null;
    }
    
    toggleBuildMode() {
        this.buildMode = !this.buildMode;
        this.ghostBuilding = null;
    }
}

export { Building, BuildSystem };
