export function createGraphContainer() {
    const container = document.createElement('div');
    container.id = 'graph-container';
    container.style.cssText = 'position:absolute;bottom:10px;left:10px;width:400px;height:200px;background:rgba(0,0,0,0.7);border-radius:4px;';
    document.body.appendChild(container);
    return container;
}
