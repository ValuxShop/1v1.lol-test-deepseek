class Player {
    constructor(id, isLocal = false) {
        this.id = id;
        this.isLocal = isLocal;
        
        // Position and rotation
        this.position = { x: 0, y: 2, z: 0 };
        this.rotation = { x: 0, y: 0 }; // Pitch and yaw
        this.velocity = { x: 0, y: 0, z: 0 };
        
        // Movement properties
        this.speed = 5;
        this.sprintSpeed = 8;
        this.jumpForce = 12;
        this.acceleration = 50;
        this.deceleration = 40;
        
        // State
        this.isGrounded = false;
        this.isSprinting = false;
        this.isCrouching = false;
        this.isBuilding = false;
        this.health = 100;
        this.shield = 100;
        this.isAlive = true;
        
        // Combat
        this.currentWeapon = 0;
        this.weapons = [];
        this.lastShotTime = 0;
        this.kills = 0;
        
        // Visual
        this.color = isLocal ? '#00ff00' : '#ff0000';
        this.radius = 0.5;
        this.height = 1.8;
        
        // Building materials
        this.materials = {
            wood: 999,
            brick: 999,
            metal: 999
        };
    }
    
    getBounds() {
        const halfHeight = this.height / 2;
        return {
            min: {
                x: this.position.x - this.radius,
                y: this.position.y - halfHeight,
                z: this.position.z - this.radius
            },
            max: {
                x: this.position.x + this.radius,
                y: this.position.y + halfHeight,
                z: this.position.z + this.radius
            }
        };
    }
    
    getCameraPosition() {
        return {
            x: this.position.x,
            y: this.position.y + this.height * 0.8, // Eye level
            z: this.position.z
        };
    }
    
    getForwardVector() {
        const yaw = this.rotation.y;
        return {
            x: -Math.sin(yaw),
            y: 0,
            z: -Math.cos(yaw)
        };
    }
    
    getRightVector() {
        const yaw = this.rotation.y;
        return {
            x: Math.cos(yaw),
            y: 0,
            z: -Math.sin(yaw)
        };
    }
    
    update(input, deltaTime, physics) {
        if (!this.isAlive) return;
        
        // Update rotation from mouse input
        if (this.isLocal && input.mouseLocked) {
            const mouseDelta = input.getMouseDelta();
            this.rotation.y += mouseDelta.x;
            this.rotation.x -= mouseDelta.y;
            
            // Clamp pitch
            this.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.rotation.x));
        }
        
        // Movement input
        let moveX = 0;
        let moveZ = 0;
        
        if (this.isLocal) {
            if (input.isKeyDown('w')) moveZ -= 1;
            if (input.isKeyDown('s')) moveZ += 1;
            if (input.isKeyDown('a')) moveX -= 1;
            if (input.isKeyDown('d')) moveX += 1;
            
            // Sprint
            this.isSprinting = input.isKeyDown('shift') && this.isGrounded;
            
            // Jump
            if (input.isKeyDown(' ') && this.isGrounded) {
                this.velocity.y = this.jumpForce;
                this.isGrounded = false;
            }
            
            // Crouch
            this.isCrouching = input.isKeyDown('control');
        }
        
        // Normalize movement vector
        const moveLength = Math.sqrt(moveX * moveX + moveZ * moveZ);
        if (moveLength > 0) {
            moveX /= moveLength;
            moveZ /= moveLength;
        }
        
        // Calculate target velocity
        const currentSpeed = this.isSprinting ? this.sprintSpeed : this.speed;
        const forward = this.getForwardVector();
        const right = this.getRightVector();
        
        const targetVelocity = {
            x: (forward.x * moveZ + right.x * moveX) * currentSpeed,
            y: this.velocity.y,
            z: (forward.z * moveZ + right.z * moveX) * currentSpeed
        };
        
        // Apply acceleration
        const accel = this.isGrounded ? this.acceleration : this.acceleration * 0.2;
        this.velocity.x = this.lerp(this.velocity.x, targetVelocity.x, accel * deltaTime);
        this.velocity.z = this.lerp(this.velocity.z, targetVelocity.z, accel * deltaTime);
        
        // Apply physics
        physics.resolvePlayerCollision(this, deltaTime);
        
        // Update position
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        this.position.z += this.velocity.z * deltaTime;
        
        // Apply deceleration when no input
        if (moveLength === 0 && this.isGrounded) {
            const decel = this.deceleration * deltaTime;
            const velX = this.velocity.x;
            const velZ = this.velocity.z;
            const speed = Math.sqrt(velX * velX + velZ * velZ);
            
            if (speed > 0) {
                const scale = Math.max(0, speed - decel) / speed;
                this.velocity.x *= scale;
                this.velocity.z *= scale;
            }
        }
        
        // Update height for crouching
        this.height = this.isCrouching ? 1.2 : 1.8;
    }
    
    lerp(a, b, t) {
        return a + (b - a) * t;
    }
    
    takeDamage(amount, damageType = 'bullet') {
        // Apply to shield first
        if (this.shield > 0) {
            const shieldDamage = Math.min(this.shield, amount * 0.7); // Shield absorbs 70%
            this.shield -= shieldDamage;
            amount -= shieldDamage / 0.7; // Remaining damage after shield
        }
        
        // Apply remaining to health
        this.health -= amount;
        
        if (this.health <= 0) {
            this.health = 0;
            this.isAlive = false;
            return true; // Player died
        }
        
        return false;
    }
    
    heal(amount) {
        this.health = Math.min(100, this.health + amount);
    }
    
    addShield(amount) {
        this.shield = Math.min(100, this.shield + amount);
    }
    
    respawn(spawnPoint) {
        this.position = { ...spawnPoint };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.health = 100;
        this.shield = 100;
        this.isAlive = true;
    }
}

export default Player;
