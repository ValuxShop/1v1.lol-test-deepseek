class AI {
    constructor(player, targetPlayer) {
        this.player = player;
        this.target = targetPlayer;
        this.state = 'idle';
        this.stateTimer = 0;
        this.nextActionTime = 0;
        
        // AI parameters
        this.sightRange = 50;
        this.attackRange = 30;
        this.buildHealthThreshold = 100;
        
        // Behavior weights
        this.weights = {
            attack: 0.6,
            build: 0.3,
            reposition: 0.1
        };
        
        // Patrol points (would be generated based on map)
        this.patrolPoints = [
            { x: -20, z: -20 },
            { x: 20, z: -20 },
            { x: 20, z: 20 },
            { x: -20, z: 20 }
        ];
        this.currentPatrolIndex = 0;
    }
    
    update(deltaTime, currentTime, physics, buildSystem) {
        if (!this.player.isAlive) return;
        
        this.stateTimer += deltaTime;
        
        // Calculate distance to target
        const dx = this.target.position.x - this.player.position.x;
        const dz = this.target.position.z - this.player.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // Update state based on situation
        this.updateState(distance, currentTime);
        
        // Execute current state behavior
        switch (this.state) {
            case 'idle':
                this.idleBehavior(deltaTime);
                break;
            case 'patrol':
                this.patrolBehavior(deltaTime);
                break;
            case 'chase':
                this.chaseBehavior(deltaTime, distance, dx, dz);
                break;
            case 'attack':
                this.attackBehavior(deltaTime, distance, dx, dz);
                break;
            case 'build':
                this.buildBehavior(deltaTime, buildSystem);
                break;
            case 'reposition':
                this.repositionBehavior(deltaTime);
                break;
        }
        
        // Simple obstacle avoidance
        this.avoidObstacles(physics);
    }
    
    updateState(distance, currentTime) {
        // State transitions
        if (this.stateTimer > 5 || currentTime > this.nextActionTime) {
            // Re-evaluate state
            const states = ['patrol', 'chase', 'build', 'reposition'];
            const weights = [...Object.values(this.weights)];
            
            // Adjust weights based on situation
            if (distance < this.sightRange) {
                weights[0] *= 0.5; // Less likely to patrol
                weights[1] *= 1.5; // More likely to chase
            }
            
            if (this.player.health < this.buildHealthThreshold) {
                weights[2] *= 2.0; // More likely to build
            }
            
            // Normalize weights
            const total = weights.reduce((a, b) => a + b, 0);
            const normalized = weights.map(w => w / total);
            
            // Choose state
            let rand = Math.random();
            let chosenState = 'patrol';
            
            for (let i = 0; i < states.length; i++) {
                if (rand < normalized[i]) {
                    chosenState = states[i];
                    break;
                }
                rand -= normalized[i];
            }
            
            this.state = chosenState;
            this.stateTimer = 0;
            this.nextActionTime = currentTime + 2 + Math.random() * 3;
        }
        
        // Forced state transitions
        if (distance < this.attackRange && this.state !== 'attack') {
            this.state = 'attack';
            this.stateTimer = 0;
        } else if (distance > this.attackRange && this.state === 'attack') {
            this.state = 'chase';
            this.stateTimer = 0;
        }
    }
    
    idleBehavior(deltaTime) {
        // Look around slowly
        this.player.rotation.y += 0.5 * deltaTime;
    }
    
    patrolBehavior(deltaTime) {
        const targetPoint = this.patrolPoints[this.currentPatrolIndex];
        const dx = targetPoint.x - this.player.position.x;
        const dz = targetPoint.z - this.player.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance < 2) {
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
        } else {
            // Move towards patrol point
            const angle = Math.atan2(dx, dz);
            this.player.rotation.y = angle;
            
            // Move forward
            this.player.velocity.x = -Math.sin(angle) * this.player.speed;
            this.player.velocity.z = -Math.cos(angle) * this.player.speed;
        }
    }
    
    chaseBehavior(deltaTime, distance, dx, dz) {
        // Look at target
        const angle = Math.atan2(dx, dz);
        this.player.rotation.y = angle;
        
        // Move towards target
        if (distance > 5) {
            this.player.velocity.x = -Math.sin(angle) * this.player.speed;
            this.player.velocity.z = -Math.cos(angle) * this.player.speed;
        } else {
            // Close enough, stop
            this.player.velocity.x = 0;
            this.player.velocity.z = 0;
        }
    }
    
    attackBehavior(deltaTime, distance, dx, dz) {
        // Look at target
        const angle = Math.atan2(dx, dz);
        this.player.rotation.y = angle;
        
        // Strafe while shooting
        if (this.stateTimer % 2 < 1) {
            // Strafe left
            this.player.velocity.x = Math.cos(angle) * this.player.speed * 0.5;
            this.player.velocity.z = -Math.sin(angle) * this.player.speed * 0.5;
        } else {
            // Strafe right
            this.player.velocity.x = -Math.cos(angle) * this.player.speed * 0.5;
            this.player.velocity.z = Math.sin(angle) * this.player.speed * 0.5;
        }
        
        // Random jump
        if (Math.random() < 0.01 && this.player.isGrounded) {
            this.player.velocity.y = this.player.jumpForce;
        }
        
        // Shoot (this would trigger actual shooting in Game.js)
        // For now, we just set a flag that Game.js will check
        this.player.isShooting = true;
    }
    
    buildBehavior(deltaTime, buildSystem) {
        // Simple building logic - build a wall in front
        if (!buildSystem.buildMode) {
            buildSystem.toggleBuildMode();
        }
        
        // Look straight ahead
        this.player.rotation.y += Math.sin(this.stateTimer) * 0.1;
        
        // Place building
        this.player.isBuilding = true;
    }
    
    repositionBehavior(deltaTime) {
        // Move to a random position
        const angle = Math.random() * Math.PI * 2;
        this.player.rotation.y = angle;
        
        this.player.velocity.x = -Math.sin(angle) * this.player.speed;
        this.player.velocity.z = -Math.cos(angle) * this.player.speed;
    }
    
    avoidObstacles(physics) {
        // Simple obstacle detection - raycast forward
        const forward = this.player.getForwardVector();
        const pos = this.player.getCameraPosition();
        
        const hit = physics.raycast(pos, forward, 5);
        if (hit) {
            // Turn away from obstacle
            this.player.rotation.y += Math.PI * 0.5;
        }
    }
}

export default AI;
