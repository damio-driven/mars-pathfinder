import { Component, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';

@Component({
  selector: 'app-star-background',
  standalone: true,
  template: `<canvas #canvas></canvas>`,
  styles: [
    `
      canvas {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
      }
    `
  ]
})
export class StarBackgroundComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private animationFrameId!: number;
  private stars: { x: number; y: number; size: number; speed: number; zIndex: number }[] = [];

  private lastTime: number = 0;
  private rotation: number = 0;

  private starCount: number = 200;
  private foregroundStarCount: number = 50;
  private backgroundStarCount: number = 100;

  get elementWidth(): number {
    return this.canvas?.width || 0;
  }

  get elementHeight(): number {
    return this.canvas?.height || 0;
  }

  ngAfterViewInit(): void {
    this.ctx = this.canvas.getContext('2d')!;
    this.initStars();
    this.animate();
  }

  private initStars(): void {
    this.stars = [];

    const generateStars = (count: number, minSpeed: number, maxSpeed: number, sizeMin: number, sizeMax: number) => {
      for (let i = 0; i < count; i++) {
        this.stars.push({
          x: Math.random() * this.elementWidth,
          y: Math.random() * this.elementHeight,
          size: Math.random() * (sizeMax - sizeMin) + sizeMin,
          speed: (Math.random() - 0.5) * (maxSpeed - minSpeed) + minSpeed,
          zIndex: Math.random() * 5 + 1
        });
      }
    };

    generateStars(this.backgroundStarCount, 0.1, 0.5, 1, 2);
    generateStars(this.starCount, 0.5, 1.5, 1, 3);
    generateStars(this.foregroundStarCount, 1, 3, 2, 4);
  }

  private update(): void {
    this.rotation += 0.002;
    this.stars.forEach(star => {
      star.x += star.speed * 0.5;
      star.y += star.speed * 0.5;

      if (star.x < 0) star.x = this.elementWidth;
      if (star.x > this.elementWidth) star.x = 0;
      if (star.y < 0) star.y = this.elementHeight;
      if (star.y > this.elementHeight) star.y = 0;
    });
  }

  private draw(): void {
    this.ctx.clearRect(0, 0, this.elementWidth, this.elementHeight);

    this.stars.forEach(star => {
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + star.zIndex * 0.15})`;
      this.ctx.fill();
    });

    this.drawConstellations();
  }

  private drawConstellations(): void {
    const drawLines = () => {
      if (Math.random() > 0.7) return;

      const starsToConnect = 5;
      const indices = new Set<number>();

      while (indices.size < starsToConnect && this.stars.length > 0) {
        indices.add(Math.floor(Math.random() * this.stars.length));
      }

      const starIndices = Array.from(indices);
      const lines: { x1: number; y1: number; x2: number; y2: number; opacity: number }[] = [];

      for (let i = 0; i < starIndices.length; i++) {
        for (let j = i + 1; j < starIndices.length; j++) {
          const dx = this.stars[starIndices[i]].x - this.stars[starIndices[j]].x;
          const dy = this.stars[starIndices[i]].y - this.stars[starIndices[j]].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            lines.push({
              x1: this.stars[starIndices[i]].x,
              y1: this.stars[starIndices[i]].y,
              x2: this.stars[starIndices[j]].x,
              y2: this.stars[starIndices[j]].y,
              opacity: 1 - (distance / 150) * 0.3
            });
          }
        }
      }

      lines.forEach(line => {
        this.ctx.beginPath();
        this.ctx.moveTo(line.x1, line.y1);
        this.ctx.lineTo(line.x2, line.y2);
        this.ctx.strokeStyle = `rgba(0, 212, 255, ${line.opacity * 0.2})`;
        this.ctx.lineWidth = 0.5;
        this.ctx.stroke();
      });
    };

    drawLines();
  }

  private animate(currentTime: number = 0): void {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.update();
    this.draw();

    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}
