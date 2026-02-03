class UI {
    constructor() {
        this.elements = {
            mainMenu: document.getElementById('mainMenu'),
            gameContainer: document.getElementById('gameContainer'),
            loadingScreen: document.getElementById('loadingScreen'),
            gameMenu: document.getElementById('gameMenu'),
            healthFill: document.getElementById('healthFill'),
            healthText: document.getElementById('healthText'),
            shieldFill: document.getElementById('shieldFill'),
            shieldText: document.getElementById('shieldText'),
            killCount: document.getElementById('killCount'),
            weaponSlots: document.querySelectorAll('.weapon-slot'),
            buildOptions: document.querySelectorAll('.build-option'),
            crosshair: document.getElementById('crosshair'),
            killFeed: document.getElementById('killFeed'),
            loadingProgress: document.getElementById('loadingProgress')
        };
        
        this.isGameMenuOpen = false;
        this.killFeedEntries = [];
        
        this.bindEvents();
    }
    
    bindEvents() {
        // Menu buttons
        document.getElementById('playButton').addEventListener('click', () => {
            this.hideMenu();
            this.showLoadingScreen();
        });
        
        document.getElementById('practiceButton').addEventListener('click', () => {
            // Would load practice mode
            console.log('Practice mode selected');
        });
        
        document.getElementById('settingsButton').addEventListener('click', () => {
            // Would show settings
            console.log('Settings selected');
        });
        
        // Game menu buttons
        document.getElementById('resumeButton').addEventListener('click', () => {
            this.toggleGameMenu(false);
        });
        
        document.getElementById('restartButton').addEventListener('click', () => {
            // Would restart game
            console.log('Restart game');
            this.toggleGameMenu(false);
        });
        
        document.getElementById('quitButton').addEventListener('click', () => {
            this.showMenu();
            this.toggleGameMenu(false);
        });
        
        // Weapon slot clicks
        this.elements.weaponSlots.forEach(slot => {
            slot.addEventListener('click', (e) => {
                const slotNum = parseInt(e.currentTarget.dataset.slot);
                // Would switch weapon
                console.log(`Switch to weapon slot ${slotNum}`);
            });
        });
        
        // Build option clicks
        this.elements.buildOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const buildType = e.currentTarget.dataset.build;
                // Would switch build type
                console.log(`Switch to build type: ${buildType}`);
            });
        });
        
        // Mode selection
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
            });
        });
        
        // Escape key for game menu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.toggleGameMenu(!this.isGameMenuOpen);
            }
        });
    }
    
    showMenu() {
        this.elements.mainMenu.classList.remove('hidden');
        this.elements.gameContainer.classList.add('hidden');
    }
    
    hideMenu() {
        this.elements.mainMenu.classList.add('hidden');
    }
    
    showGame() {
        this.elements.gameContainer.classList.remove('hidden');
    }
    
    showLoadingScreen() {
        this.elements.loadingScreen.classList.remove('hidden');
        
        // Simulate loading progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                
                setTimeout(() => {
                    this.elements.loadingScreen.classList.add('hidden');
                    this.showGame();
                }, 500);
            }
            this.elements.loadingProgress.style.width = `${progress}%`;
        }, 100);
    }
    
    toggleGameMenu(show) {
        this.isGameMenuOpen = show;
        if (show) {
            this.elements.gameMenu.classList.remove('hidden');
        } else {
            this.elements.gameMenu.classList.add('hidden');
        }
    }
    
    updatePlayerHUD(player) {
        // Update health
        const healthPercent = player.health / 100;
        this.elements.healthFill.style.width = `${healthPercent * 100}%`;
        this.elements.healthText.textContent = Math.round(player.health);
        
        // Update shield
        const shieldPercent = player.shield / 100;
        this.elements.shieldFill.style.width = `${shieldPercent * 100}%`;
        this.elements.shieldText.textContent = Math.round(player.shield);
        
        // Update kill count
        this.elements.killCount.textContent = player.kills;
        
        // Update weapon slots
        if (player.weapons.length > 0) {
            this.elements.weaponSlots.forEach((slot, index) => {
                if (index < player.weapons.length) {
                    const weapon = player.weapons[index];
                    const ammoText = slot.querySelector('.ammo-count');
                    if (ammoText) {
                        ammoText.textContent = weapon.getAmmoString();
                    }
                    
                    // Highlight active weapon
                    if (index === player.currentWeapon) {
                        slot.classList.add('active');
                    } else {
                        slot.classList.remove('active');
                    }
                }
            });
        }
        
        // Update crosshair for build mode
        if (player.isBuilding) {
            this.elements.crosshair.style.display = 'none';
        } else {
            this.elements.crosshair.style.display = 'block';
        }
    }
    
    addKillFeedEntry(killer, victim, weapon) {
        const entry = document.createElement('div');
        entry.className = 'kill-feed-entry';
        entry.innerHTML = `
            <span class="killer">${killer}</span>
            <span class="weapon">${weapon}</span>
            <span class="victim">${victim}</span>
        `;
        
        this.elements.killFeed.prepend(entry);
        this.killFeedEntries.unshift(entry);
        
        // Remove old entries
        if (this.killFeedEntries.length > 5) {
            const oldEntry = this.killFeedEntries.pop();
            oldEntry.remove();
        }
        
        // Fade out after 5 seconds
        setTimeout(() => {
            entry.style.opacity = '0';
            setTimeout(() => {
                if (entry.parentNode) {
                    entry.remove();
                    const index = this.killFeedEntries.indexOf(entry);
                    if (index > -1) {
                        this.killFeedEntries.splice(index, 1);
                    }
                }
            }, 1000);
        }, 5000);
    }
    
    showMessage(text, duration = 3000) {
        // Create message element
        const message = document.createElement('div');
        message.className = 'game-message';
        message.textContent = text;
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 1.5rem;
            z-index: 100;
            pointer-events: none;
        `;
        
        document.body.appendChild(message);
        
        // Remove after duration
        setTimeout(() => {
            message.style.opacity = '0';
            message.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 500);
        }, duration);
    }
}

export default UI;
