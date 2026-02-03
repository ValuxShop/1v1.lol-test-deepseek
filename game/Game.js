import Input from './Input.js';
import Physics from './Physics.js';
import Player from './Player.js';
import Weapon from './Weapon.js';
import { BuildSystem } from './BuildSystem.js';
import AI from './AI.js';
import Renderer from './Renderer.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.input = new Input();
        this.physics = new Physics();
        this.renderer = new Renderer(this.canvas);
        
        this.players = [];
        this.bullets = [];
        this.buildSystem = new BuildSystem();
        this.ai = null;
        
        this.gameTime = 0;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.isRunning = false;
        this.gameMode = '1v1';
        
        this.spawnPoints = [
            { x: -30, y: 2, z: -30 },
            { x: 30, y: 2, z: 30 },
            { x: -30, y: 2, z: 30 },
            { x: 30, y: 2, z: -30 }
        ];
        
        this.init();
    }
    
    init() {
        // Resize renderer
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Create local player
        const localPlayer = new Player(1, true);
        localPlayer.position = { ...this.spawnPoints[0] };
        
        // Give weapons
        localPlayer.weapons = [
            new Weapon('assault_rifle'),
            new Weapon('shotgun'),
            new Weapon('smg'),
            new Weapon('sniper')
        ];
        localPlayer.currentWeapon = 0;
        
        this.players.push(localPlayer);
        this.physics.addCollider(localPlayer);
        
        // Create AI opponent
        const aiPlayer = new Player(2, false);
        aiPlayer.position = { ...this.spawnPoints[1] };
        aiPlayer.color = '#ff0000';
        
        aiPlayer.weapons = [
            new Weapon('assault_rifle'),
            new Weapon('shotgun')
        ];
        
        this.players.push(aiPlayer);
        this.physics.addCollider(aiPlayer);
        
        // Create AI controller
        this.ai = new AI(aiPlayer, localPlayer);
        
        // Create some initial buildings
        this.createInitialBuildings();
        
        // Start game loop
        this.isRunning = true;
        this.gameLoop();
    }
    
    resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.renderer.resize(width, height);
    }
    
    createInitialBuildings() {
        // Create a simple 1v1 arena
        const buildings = [];
        
        // Floor
        for (let x = -5; x <= 5; x++) {
            for (let z = -5; z <= 5; z++) {
                buildings.push({
                    type: 'floor',
                    position: { x: x * 4, y: 0, z: z * 4 },
                    rotation: 0,
                    material: 'wood'
                });
            }
        }
        
        // Some cover
        buildings.push(
            { type: 'wall', position: { x: -10, y: 0, z: 0 }, rotation: 0, material: 'wood' },
            { type: 'wall', position: { x: 10, y: 0, z: 0 }, rotation: 0, material: 'wood' },
            { type: 'ramp', position: { x: 0, y: 0, z: -10 }, rotation: Math.PI, material: 'wood' },
            { type: 'ramp', position: { x: 0, y: 0, z: 10 }, rotation: 0, material: 'wood' }
        );
        
        // Add to physics
        buildings.forEach(buildingData => {
            const building = new Building(
                buildingData.type,
                buildingData.position,
                buildingData.rotation,
                buildingData.material
            );
            this.physics.addBuilding(building);
        });
    }
    
    gameLoop(currentTime = 0) {
        if (!this.isRunning) return;
        
        // Calculate delta time
        if (this.lastTime === 0) this.lastTime = currentTime;
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        this.gameTime = currentTime;
        
        // Clamp delta time to prevent large jumps
        this.deltaTime = Math.min(this.deltaTime, 0.1);
        
        // Update game state
        this.update(this.deltaTime, currentTime);
        
        // Render
        this.renderer.render(this);
        
        // Request next frame
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime, currentTime) {
        const localPlayer = this.players.find(p => p.isLocal);
        const aiPlayer = this.players.find(p => !p.isLocal);
        
        if (!localPlayer || !localPlayer.isAlive) return;
        
        // Lock pointer on click
        if (this.input.isMouseDown(0) && !this.input.mouseLocked) {
            this.input.lockPointer(this.canvas);
        }
        
        // Update local player
        localPlayer.update(this.input, deltaTime, this.physics);
        
        // Handle shooting
        if (this.input.isMouseDown(0) && this.input.mouseLocked && !localPlayer.isBuilding) {
            const weapon = localPlayer.weapons[localPlayer.currentWeapon];
            if (weapon) {
                const newBullets = weapon.shoot(localPlayer, currentTime, this.physics);
                this.bullets.push(...newBullets);
                
                // Process bullet hits
                newBullets.forEach(bullet => {
                    if (bullet.hit && bullet.hit.type === 'player') {
                        const hitPlayer = bullet.hit.object;
                        const died = hitPlayer.takeDamage(bullet.damage);
                        
                        if (died && hitPlayer === aiPlayer) {
                            localPlayer.kills++;
                            // Respawn AI
                            setTimeout(() => {
                                aiPlayer.respawn(this.spawnPoints[1]);
                            }, 3000);
                        }
                    }
                });
            }
        }
        
        // Handle weapon switching
        if (this.input.isKeyDown('1')) localPlayer.currentWeapon = 0;
        if (this.input.isKeyDown('2')) localPlayer.currentWeapon = 1;
        if (this.input.isKeyDown('3')) localPlayer.currentWeapon = 2;
        if (this.input.isKeyDown('4')) localPlayer.currentWeapon = 3;
        if (this.input.isKeyDown('5')) {
            localPlayer.isBuilding = !localPlayer.isBuilding;
            this.buildSystem.toggleBuildMode();
            this.input.keys['5'] = false; // Clear key state
        }
        
        // Handle building
        if (localPlayer.isBuilding) {
            this.buildSystem.update(localPlayer, this.input, this.physics, currentTime);
        }
        
        // Update AI
        if (aiPlayer && aiPlayer.isAlive) {
            this.ai.update(deltaTime, currentTime, this.physics, this.buildSystem);
            
            // AI shooting
            if (this.ai.player.isShooting) {
                const weapon = aiPlayer.weapons[aiPlayer.currentWeapon];
                if (weapon && weapon.canShoot(currentTime)) {
                    const aiBullets = weapon.shoot(aiPlayer, currentTime, this.physics);
                    this.bullets.push(...aiBullets);
                    
                    // Process AI bullet hits
                    aiBullets.forEach(bullet => {
                        if (bullet.hit && bullet.hit.type === 'player') {
                            const hitPlayer = bullet.hit.object;
                            if (hitPlayer === localPlayer) {
                                hitPlayer.takeDamage(bullet.damage);
                            }
                        }
                    });
                }
                this.ai.player.isShooting = false;
            }
        }
        
        // Update bullets (remove old ones)
        this.bullets = this.bullets.filter(bullet => {
            return currentTime - bullet.time < 1000; // Keep for 1 second
        });
        
        // Update weapon reloads
        localPlayer.weapons.forEach(weapon => {
            weapon.updateReload(currentTime);
        });
        
        // Start reload on R key
        if (this.input.isKeyDown('r') && !localPlayer.isBuilding) {
            const weapon = localPlayer.weapons[localPlayer.currentWeapon];
            if (weapon) {
                weapon.startReload(currentTime);
                this.input.keys['r'] = false;
            }
        }
        
        // Reset input deltas
        this.input.reset();
    }
    
    pause() {
        this.isRunning = false;
        this.input.unlockPointer();
    }
    
    resume() {
        this.isRunning = true;
        this.lastTime = 0;
        this.gameLoop();
    }
    
    getPlayerById(id) {
        return this.players.find(p => p.id === id);
    }
}

export default Game;
