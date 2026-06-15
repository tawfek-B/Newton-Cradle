function createBox(color) {
    const box = document.createElement("div");
    box.style.width = "14px";
    box.style.height = "14px";
    box.style.background = color;
    box.style.position = "absolute";
    return box;
  }
  
  function createText(text) {
    const el = document.createElement("span");
    el.style.color = "white";
    el.style.position = "absolute";
    el.style.left = "16px";
    el.style.fontSize = '14px';
    el.textContent = text;
    return el;
  }
  
  export function createHUD() {
    const hud = document.getElementById("hud");
  
    const items = [
      ["acc", "red", "Total Acceleration (m/s²)"],
      ["tan", "yellow", "Tangential Acceleration (m/s²)"],
      ["cen", "purple", "Centripetal Acceleration (m/s²)"],
      ["vel", "green", "Velocity (m/s)"],
      ["omega", "maroon", "Angular Velocity (rad/s)"],
      ["alpha", "orange", "Angular Acceleration (rad/s²)"],

      ["ten", "blue", "Tension (N)"],
      ["weight", "cyan", "Weight (N)"],
    ];
  
    const elements = {};
  
    items.forEach(([key, color, label], i) => {
      const box = createBox(color);
      const text = createText(label);
  
      hud.appendChild(box);
      hud.appendChild(text);
  
      elements[key] = { box, text };
  
      const y = 20 + i * 30;
  
      box.style.left = "20px";
      box.style.top = y + "px";
  
      text.style.left = "40px";
      text.style.top = (y - 1) + "px";
    });
  
    return elements;
  }

  function setHUDVisibility(elements, visible) {
    for (const key in elements) {
      elements[key].box.style.display = visible ? "block" : "none";
      elements[key].text.style.display = visible ? "block" : "none";
    }
  }

  export function updateHUD(elements, data, visible) {
    for (const key in data) {
      if (elements[key]) {
        //each text should contain an array of values
        const value = data[key];
        if (Array.isArray(value)) {
          elements[key].text.textContent = `${elements[key].text.textContent.split(':')[0]}: [${value.map(v => v.toFixed(2)).join(', ')}]`;
        } else {
          elements[key].text.textContent = `${elements[key].text.textContent.split(':')[0]}: ${value.toFixed(2)}`;
        }
      }
    }
    setHUDVisibility(elements,visible);
  }
