class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.camera = {
            position: { x: 0, y: 10, z: 20 },
            target: { x: 0, y: 0, z: 0 },
            fov: 60 * Math.PI / 180
        };
        
        this.aspectRatio = 16 / 9;
        this.nearPlane = 0.1;
        this.farPlane = 1000;
        
        this.projectionMatrix = this.createProjectionMatrix();
        this.viewMatrix = this.createViewMatrix();
        
        // Rendering options
        this.renderDistance = 500;
        this.fogDistance = 300;
        
        // Performance
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        this.fps = 60;
    }
    
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.aspectRatio = width / height;
        this.projectionMatrix = this.createProjectionMatrix();
    }
    
    createProjectionMatrix() {
        const f = 1.0 / Math.tan(this.camera.fov / 2);
        const range = 1.0 / (this.nearPlane - this.farPlane);
        
        return [
            [f / this.aspectRatio, 0, 0, 0],
            [0, f, 0, 0],
            [0, 0, (this.farPlane + this.nearPlane) * range, -1],
            [0, 0, 2 * this.farPlane * this.nearPlane * range, 0]
        ];
    }
    
    createViewMatrix() {
        // Simplified view matrix for 2D projection
        return [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ];
    }
    
    projectPoint(point) {
        // Simple orthographic projection for top-down view
        // In a full 3D engine, this would use the projection matrix
        
        const scale = 20; // Zoom level
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // For now, use a simple 2D projection
        return {
            x: centerX + point.x * scale,
            y: centerY - point.z * scale, // Invert Z for 2D
            depth: point.y // Store Y as depth for sorting
        };
    }
    
    render(game) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear canvas
        ctx.fillStyle = '#87CEEB'; // Sky blue
        ctx.fillRect(0, 0, width, height);
        
        // Draw ground
        this.drawGround(ctx, width, height);
        
        // Draw buildings
        game.physics.buildings.forEach(building => {
            this.drawBuilding(ctx, building);
        });
        
        // Draw players
        game.players.forEach(player => {
            this.drawPlayer(ctx, player);
        });
        
        // Draw ghost building
        if (game.buildSystem.buildMode && game.buildSystem.ghostBuilding) {
            this.drawGhostBuilding(ctx, game.buildSystem.ghostBuilding, game.buildSystem.canBuild);
        }
        
        // Draw bullets/effects
        game.bullets.forEach(bullet => {
            this.drawBulletTracer(ctx, bullet);
        });
        
        // Update FPS counter
        this.updateFPS(game.currentTime);
        
        // Draw FPS (debug)
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.fillText(`FPS: ${this.fps}`, 10, 20);
    }
    
    drawGround(ctx, width, height) {
        // Draw simple ground
        const groundHeight = height * 0.7;
        
        // Ground color gradient
        const gradient = ctx.createLinearGradient(0, groundHeight, 0, height);
        gradient.addColorStop(0, '#8B4513'); // Brown
        gradient.addColorStop(1, '#654321'); // Dark brown
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, groundHeight, width, height - groundHeight);
        
        // Draw grid for building reference
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        const gridSize = 50;
        const centerX = width / 2;
        const centerY = groundHeight;
        
        // Vertical lines
        for (let x = -10; x <= 10; x++) {
            const screenX = centerX + x * gridSize;
            ctx.beginPath();
            ctx.moveTo(screenX, centerY);
            ctx.lineTo(screenX, height);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let z = 0; z <= 10; z++) {
            const screenY = centerY + z * gridSize;
            ctx.beginPath();
            ctx.moveTo(centerX - 10 * gridSize, screenY);
            ctx.lineTo(centerX + 10 * gridSize, screenY);
            ctx.stroke();
        }
    }
    
    drawPlayer(ctx, player) {
        if (!player.isAlive) return;
        
        const pos = this.projectPoint(player.position);
        const radius = 20; // Screen radius
        
        // Draw player body
        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw player direction indicator
        const forward = player.getForwardVector();
        const dirLength = 30;
        
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(
            pos.x + forward.x * dirLength,
            pos.y - forward.z * dirLength // Note: Z is inverted for 2D
        );
        ctx.stroke();
        
        // Draw health bar
        const barWidth = 40;
        const barHeight = 6;
        const barX = pos.x - barWidth / 2;
        const barY = pos.y - radius - 10;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health
        const healthWidth = (player.health / 100) * barWidth;
        ctx.fillStyle = player.health > 50 ? '#00ff00' : player.health > 25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(barX, barY, healthWidth, barHeight);
        
        // Shield
        if (player.shield > 0) {
            const shieldWidth = (player.shield / 100) * barWidth;
            ctx.fillStyle = 'rgba(0, 150, 255, 0.7)';
            ctx.fillRect(barX, barY - 8, shieldWidth, 4);
        }
        
        // Player name/ID
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(player.isLocal ? 'You' : `Player ${player.id}`, pos.x, barY - 15);
    }
    
    drawBuilding(ctx, building) {
        const pos = this.projectPoint(building.position);
        const size = building.getSize();
        
        // Scale size for screen
        const screenWidth = size.width * 40;
        const screenHeight = size.height * 40;
        const screenDepth = size.depth * 40;
        
        // Set color based on material and health
        let color;
        switch (building.material) {
            case 'wood':
                color = '#8B4513';
                break;
            case 'brick':
                color = '#B22222';
                break;
            case 'metal':
                color = '#C0C0C0';
                break;
            default:
                color = '#8B4513';
        }
        
        // Adjust brightness based on health
        const healthRatio = building.health / building.getMaxHealth(building.material);
        if (healthRatio < 0.5) {
            // Darken damaged buildings
            color = this.darkenColor(color, 1 - healthRatio * 2);
        }
        
        ctx.fillStyle = color;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        
        // Draw based on building type
        switch (building.type) {
            case 'wall':
                ctx.fillRect(
                    pos.x - screenWidth / 2,
                    pos.y - screenHeight / 2,
                    screenWidth,
                    screenHeight
                );
                ctx.strokeRect(
                    pos.x - screenWidth / 2,
                    pos.y - screenHeight / 2,
                    screenWidth,
                    screenHeight
                );
                break;
                
            case 'floor':
                ctx.fillRect(
                    pos.x - screenWidth / 2,
                    pos.y - screenDepth / 2,
                    screenWidth,
                    screenDepth
                );
                ctx.strokeRect(
                    pos.x - screenWidth / 2,
                    pos.y - screenDepth / 2,
                    screenWidth,
                    screenDepth
                );
                break;
                
            case 'ramp':
                // Draw as a triangle for ramp
                ctx.beginPath();
                ctx.moveTo(pos.x - screenWidth / 2, pos.y + screenDepth / 2);
                ctx.lineTo(pos.x + screenWidth / 2, pos.y + screenDepth / 2);
                ctx.lineTo(pos.x + screenWidth / 2, pos.y - screenDepth / 2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
        }
        
        // Draw health bar for damaged buildings
        if (healthRatio < 1) {
            const barWidth = screenWidth;
            const barHeight = 4;
            const barX = pos.x - barWidth / 2;
            const barY = pos.y - screenHeight / 2 - 10;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            ctx.fillStyle = healthRatio > 0.5 ? '#00ff00' : healthRatio > 0.25 ? '#ffff00' : '#ff0000';
            ctx.fillRect(barX, barY, barWidth * healthRatio, barHeight);
        }
    }
    
    drawGhostBuilding(ctx, building, canBuild) {
        const pos = this.projectPoint(building.position);
        const size = building.getSize();
        
        const screenWidth = size.width * 40;
        const screenHeight = size.height * 40;
        const screenDepth = size.depth * 40;
        
        // Set ghost color (green if can build, red if not)
        ctx.fillStyle = canBuild ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
        ctx.strokeStyle = canBuild ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 2;
        
        // Draw ghost outline
        switch (building.type) {
            case 'wall':
                ctx.strokeRect(
                    pos.x - screenWidth / 2,
                    pos.y - screenHeight / 2,
                    screenWidth,
                    screenHeight
                );
                ctx.fillRect(
                    pos.x - screenWidth / 2,
                    pos.y - screenHeight / 2,
                    screenWidth,
                    screenHeight
                );
                break;
                
            case 'floor':
                ctx.strokeRect(
                    pos.x - screenWidth / 2,
                    pos.y - screenDepth / 2,
                    screenWidth,
                    screenDepth
                );
                ctx.fillRect(
                    pos.x - screenWidth / 2,
                    pos.y - screenDepth / 2,
                    screenWidth,
                    screenDepth
                );
                break;
                
            case 'ramp':
                ctx.beginPath();
                ctx.moveTo(pos.x - screenWidth / 2, pos.y + screenDepth / 2);
                ctx.lineTo(pos.x + screenWidth / 2, pos.y + screenDepth / 2);
                ctx.lineTo(pos.x + screenWidth / 2, pos.y - screenDepth / 2);
                ctx.closePath();
                ctx.stroke();
                ctx.fill();
                break;
        }
    }
    
    drawBulletTracer(ctx, bullet) {
        const from = this.projectPoint(bullet.from);
        let to;
        
        if (bullet.hit) {
            to = this.projectPoint(bullet.hit.point);
        } else {
            // Extend bullet direction
            const endPoint = {
                x: bullet.from.x + bullet.direction.x * 100,
                y: bullet.from.y + bullet.direction.y * 100,
                z: bullet.from.z + bullet.direction.z * 100
            };
            to = this.projectPoint(endPoint);
        }
        
        // Draw tracer line
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        
        // Draw hit marker
        if (bullet.hit) {
            ctx.fillStyle = bullet.hit.type === 'player' ? '#ff0000' : '#ffff00';
            ctx.beginPath();
            ctx.arc(to.x, to.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    darkenColor(color, amount) {
        // Simple color darkening
        const r = parseInt(color.substr(1, 2), 16);
        const g = parseInt(color.substr(3, 2), 16);
        const b = parseInt(color.substr(5, 2), 16);
        
        const darkR = Math.max(0, r - Math.floor(r * amount));
        const darkG = Math.max(0, g - Math.floor(g * amount));
        const darkB = Math.max(0, b - Math.floor(b * amount));
        
        return `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`;
    }
    
    updateFPS(currentTime) {
        this.frameCount++;
        
        if (currentTime - this.lastFpsUpdate >= 1000) {
            this.fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
        }
    }
}

export default Renderer;
