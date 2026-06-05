export function createDebugPanel() {
    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.cssText = 'position:absolute;top:10px;right:10px;color:white;font-family:monospace;font-size:12px;background:rgba(0,0,0,0.7);padding:10px;border-radius:4px;';
    document.body.appendChild(panel);
    return panel;
}

export function updateDebugPanel(panel, data) {
    panel.innerHTML = Object.entries(data)
        .map(([key, val]) => `${key}: ${typeof val === 'number' ? val.toFixed(4) : val}`)
        .join('<br>');
}
