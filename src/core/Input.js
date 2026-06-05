export class Input {
    constructor() {
        this.keys = {};
        this.mouse = { x: 0, y: 0, buttons: {} };

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('mousedown', (e) => {
            this.mouse.buttons[e.button] = true;
        });

        window.addEventListener('mouseup', (e) => {
            this.mouse.buttons[e.button] = false;
        });
    }

    isKeyDown(code) {
        return !!this.keys[code];
    }

    isMouseDown(button = 0) {
        return !!this.mouse.buttons[button];
    }
}
