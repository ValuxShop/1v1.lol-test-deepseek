import UI from './game/UI.js';
import Game from './game/Game.js';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI
    const ui = new UI();
    
    // Initialize game when Play button is clicked
    document.getElementById('playButton').addEventListener('click', () => {
        // Hide menu and show loading screen
        ui.hideMenu();
        ui.showLoadingScreen();
        
        // Initialize game after a short delay (simulating load time)
        setTimeout(() => {
            const game = new Game();
            
            // Update UI with game state
            const updateUI = () => {
                const localPlayer = game.players.find(p => p.isLocal);
                if (localPlayer) {
                    ui.updatePlayerHUD(localPlayer);
                }
                
                requestAnimationFrame(updateUI);
            };
            
            updateUI();
            
            // Store game instance for dev tools
            window.game = game;
            window.ui = ui;
            
        }, 2000);
    });
    
    // Dev tools - expose game instance
    console.log('1v1.lol Classic Edition loaded');
    console.log('Controls: WASD - Move, SPACE - Jump, Mouse - Look/Shoot, 1-5 - Weapons, F - Build Mode, R - Reload/Rotate');
});
