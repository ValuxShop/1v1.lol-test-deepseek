class Input {
    constructor() {
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            buttons: {},
            sensitivity: 0.002
        };
        
        this.mouseLocked = false;
        this.pointerLockElement = null;
        
        this.bindEvents();
    }
    
    bindEvents() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.handleHotkeys(e);
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Mouse movement
        document.addEventListener('mousemove', (e) => {
            if (this.mouseLocked) {
                this.mouse.deltaX = e.movementX || e.mozMovementX || 0;
                this.mouse.deltaY = e.movementY || e.mozMovementY || 0;
                this.mouse.x += this.mouse.deltaX;
                this.mouse.y += this.mouse.deltaY;
            } else {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
                this.mouse.deltaX = 0;
                this.mouse.deltaY = 0;
            }
        });
        
        // Mouse buttons
        document.addEventListener('mousedown', (e) => {
            this.mouse.buttons[e.button] = true;
        });
        
        document.addEventListener('mouseup', (e) => {
            this.mouse.buttons[e.button] = false;
        });
        
        // Pointer lock
        document.addEventListener('pointerlockchange', () => {
            this.mouseLocked = document.pointerLockElement === this.pointerLockElement;
        });
        
        // Prevent context menu
        document.addEventListener('contextmenu', (e) => {
            if (this.mouseLocked) e.preventDefault();
        });
        
        // Prevent default for game keys
        document.addEventListener('keydown', (e) => {
            const gameKeys = [' ', 'w', 'a', 's', 'd', 'f', '1', '2', '3', '4', '5'];
            if (gameKeys.includes(e.key.toLowerCase()) && this.mouseLocked) {
                e.preventDefault();
            }
        });
    }
    
    handleHotkeys(e) {
        // Weapon switching (1-5)
        if (e.key >= '1' && e.key <= '5') {
            // Handled by Game.js
        }
        
        // Building hotkeys (F1-F3)
        if (e.key === 'F1' || e.key === 'F2' || e.key === 'F3') {
            // Handled by BuildSystem.js
        }
    }
    
    lockPointer(element) {
        this.pointerLockElement = element;
        element.requestPointerLock();
    }
    
    unlockPointer() {
        document.exitPointerLock();
    }
    
    isKeyDown(key) {
        return this.keys[key.toLowerCase()] || false;
    }
    
    isMouseDown(button = 0) {
        return this.mouse.buttons[button] || false;
    }
    
    getMouseDelta() {
        const delta = {
            x: this.mouse.deltaX * this.mouse.sensitivity,
            y: this.mouse.deltaY * this.mouse.sensitivity
        };
        
        // Reset deltas for next frame
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
        
        return delta;
    }
    
    reset() {
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
    }
}

export default Input;
