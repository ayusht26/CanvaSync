import { Shape } from '@canvasync/shared';
import { nanoid } from 'nanoid';

export type SceneObserver = () => void;

export class SceneGraph {
  private shapes: Shape[] = [];
  private observers: Set<SceneObserver> = new Set();

  public getElements(): Shape[] {
    return this.shapes;
  }

  setShapes(shapes: Shape[]) {
    this.shapes = [...shapes];
    this.notify();
  }

  add(shape: Shape) {
    this.shapes.push(shape);
    this.notify();
  }

  remove(id: string) {
    this.shapes = this.shapes.filter((s) => s.id !== id);
    this.notify();
  }

  clear() {
    this.shapes = [];
    this.notify();
  }

  update(id: string, updates: Partial<Shape>) {
    this.shapes = this.shapes.map((s) =>
      s.id === id ? ({ ...s, ...updates } as Shape) : s
    );
    this.notify();
  }

  getById(id: string): Shape | undefined {
    return this.shapes.find((s) => s.id === id);
  }

  bringToFront(id: string) {
    const index = this.shapes.findIndex((s) => s.id === id);
    if (index === -1 || index === this.shapes.length - 1) return;
    const [shape] = this.shapes.splice(index, 1);
    this.shapes.push(shape);
    this.notify();
  }

  sendToBack(id: string) {
    const index = this.shapes.findIndex((s) => s.id === id);
    if (index === -1 || index === 0) return;
    const [shape] = this.shapes.splice(index, 1);
    this.shapes.unshift(shape);
    this.notify();
  }

  bringForward(id: string) {
    const index = this.shapes.findIndex((s) => s.id === id);
    if (index === -1 || index === this.shapes.length - 1) return;
    [this.shapes[index], this.shapes[index + 1]] = [
      this.shapes[index + 1],
      this.shapes[index],
    ];
    this.notify();
  }

  sendBackward(id: string) {
    const index = this.shapes.findIndex((s) => s.id === id);
    if (index === -1 || index === 0) return;
    [this.shapes[index], this.shapes[index - 1]] = [
      this.shapes[index - 1],
      this.shapes[index],
    ];
    this.notify();
  }

  duplicate(id: string, offsetX = 20, offsetY = 20): Shape | null {
    const shape = this.getById(id);
    if (!shape) return null;
    const copy = { ...shape, id: nanoid(), x: shape.x + offsetX, y: shape.y + offsetY, createdAt: Date.now(), updatedAt: Date.now() };
    this.shapes.push(copy as Shape);
    this.notify();
    return copy as Shape;
  }

  subscribe(observer: SceneObserver) {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  private notify() {
    this.observers.forEach((obs) => obs());
  }
}

