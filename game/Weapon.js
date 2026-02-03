class Weapon {
    constructor(type) {
        this.type = type;
        this.config = this.getWeaponConfig(type);
        
        this.ammo = this.config.magazineSize;
        this.reserveAmmo = this.config.maxReserveAmmo;
        this.isReloading = false;
        this.reloadStartTime = 0;
        this.lastShotTime = 0;
        this.recoil = { x: 0, y: 0 };
        this.spread = 0;
    }
    
    getWeaponConfig(type) {
        const configs = {
            'assault_rifle': {
                name: 'Assault Rifle',
                damage: 30,
                fireRate: 600, // RPM
                magazineSize: 30,
                maxReserveAmmo: 200,
                reloadTime: 2.5,
                spread: 0.01,
                recoil: { x: 0.1, y: 0.05 },
                range: 500,
                bulletCount: 1,
                isAutomatic: true
            },
            'shotgun': {
                name: 'Shotgun',
                damage: 20,
                fireRate: 70,
                magazineSize: 8,
                maxReserveAmmo: 32,
                reloadTime: 4.0,
                spread: 0.08,
                recoil: { x: 0.3, y: 0.15 },
                range: 100,
                bulletCount: 8,
                isAutomatic: false
            },
            'smg': {
                name: 'SMG',
                damage: 22,
                fireRate: 900,
                magazineSize: 30,
                maxReserveAmmo: 150,
                reloadTime: 2.0,
                spread: 0.03,
                recoil: { x: 0.08, y: 0.04 },
                range: 300,
                bulletCount: 1,
                isAutomatic: true
            },
            'sniper': {
                name: 'Sniper Rifle',
                damage: 100,
                fireRate: 40,
                magazineSize: 1,
                maxReserveAmmo: 10,
                reloadTime: 3.5,
                spread: 0.001,
                recoil: { x: 0.5, y: 0.25 },
                range: 1000,
                bulletCount: 1,
                isAutomatic: false,
                isScoped: true
            }
        };
        
        return configs[type] || configs['assault_rifle'];
    }
    
    canShoot(currentTime) {
        if (this.isReloading) return false;
        if (this.ammo <= 0) return false;
        
        const timeBetweenShots = 60 / this.config.fireRate;
        return currentTime - this.lastShotTime >= timeBetweenShots;
    }
    
    shoot(player, currentTime, physics) {
        if (!this.canShoot(currentTime)) return [];
        
        this.ammo--;
        this.lastShotTime = currentTime;
        
        // Apply recoil to player
        player.rotation.x += this.config.recoil.y * (Math.random() - 0.5);
        player.rotation.y += this.config.recoil.x * (Math.random() - 0.5);
        
        // Calculate bullet directions
        const bullets = [];
        const cameraPos = player.getCameraPosition();
        
        for (let i = 0; i < this.config.bulletCount; i++) {
            // Calculate direction with spread
            const spread = this.config.spread * (Math.random() - 0.5) * 2;
            const direction = this.getShootingDirection(player, spread);
            
            // Perform raycast
            const hit = physics.raycast(cameraPos, direction, this.config.range);
            
            bullets.push({
                from: { ...cameraPos },
                direction: direction,
                hit: hit,
                damage: this.config.damage,
                playerId: player.id
            });
        }
        
        // Start reload if magazine is empty
        if (this.ammo === 0 && this.reserveAmmo > 0) {
            this.startReload(currentTime);
        }
        
        return bullets;
    }
    
    getShootingDirection(player, spread) {
        const yaw = player.rotation.y + (Math.random() - 0.5) * spread;
        const pitch = player.rotation.x + (Math.random() - 0.5) * spread;
        
        return {
            x: -Math.sin(yaw) * Math.cos(pitch),
            y: -Math.sin(pitch),
            z: -Math.cos(yaw) * Math.cos(pitch)
        };
    }
    
    startReload(currentTime) {
        if (this.isReloading || this.ammo === this.config.magazineSize) return;
        if (this.reserveAmmo <= 0) return;
        
        this.isReloading = true;
        this.reloadStartTime = currentTime;
    }
    
    updateReload(currentTime) {
        if (!this.isReloading) return false;
        
        if (currentTime - this.reloadStartTime >= this.config.reloadTime) {
            const needed = this.config.magazineSize - this.ammo;
            const reloadAmount = Math.min(needed, this.reserveAmmo);
            
            this.ammo += reloadAmount;
            this.reserveAmmo -= reloadAmount;
            this.isReloading = false;
            return true;
        }
        
        return false;
    }
    
    cancelReload() {
        this.isReloading = false;
    }
    
    addAmmo(amount) {
        this.reserveAmmo = Math.min(this.config.maxReserveAmmo, this.reserveAmmo + amount);
    }
    
    getAmmoString() {
        return `${this.ammo}/${this.reserveAmmo}`;
    }
}

export default Weapon;
