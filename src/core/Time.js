export class Time {
    constructor() {
      this.last = performance.now();
      this.dt = 0;
      this.elapsed = 0;
    }
  
    update(timePace = 1) {
      const now = performance.now();
      this.dt = (now - this.last) / (1000 / timePace);
      this.last = now;
  
      this.elapsed += this.dt;
  
      return this.dt;
    }
  }
