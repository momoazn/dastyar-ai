/**
 * PDF.js Node.js Polyfills
 *
 * This file provides stub implementations of browser Canvas 2D and related APIs
 * for use in Node.js environments. Methods are intentionally empty as they're
 * only needed for type compatibility with PDF.js library.
 *
 * Linting rules are disabled via biome.jsonc for this file:
 * - Empty blocks are intentional stubs for browser APIs
 * - Parameter limits relaxed for Canvas 2D API compatibility
 * - Variable shadowing patterns used in constructors for data destructuring
 */

type MatrixArray = readonly number[] | Float32Array | Float64Array | Int32Array;

type MatrixLikeObject = {
  a?: number;
  b?: number;
  c?: number;
  d?: number;
  e?: number;
  f?: number;
};

type MatrixInit = MatrixArray | MatrixLikeObject | BasicDOMMatrix | undefined;

const isMatrixArray = (value: MatrixInit): value is MatrixArray =>
  Array.isArray(value) || ArrayBuffer.isView(value);

const isMatrixObject = (value: MatrixInit): value is MatrixLikeObject =>
  typeof value === "object" && value !== null && !isMatrixArray(value);

class BasicDOMMatrix {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;

  constructor(init?: MatrixInit) {
    if (init !== undefined) {
      this.setFrom(init);
    }
  }

  private static toMatrix(source: MatrixInit): BasicDOMMatrix {
    return source instanceof BasicDOMMatrix
      ? source
      : new BasicDOMMatrix(source);
  }

  private setFrom(init: MatrixInit): void {
    if (init instanceof BasicDOMMatrix) {
      this.a = init.a;
      this.b = init.b;
      this.c = init.c;
      this.d = init.d;
      this.e = init.e;
      this.f = init.f;
      return;
    }

    if (isMatrixArray(init)) {
      const values = Array.from(init);
      if (values.length >= 6) {
        this.a = values[0] ?? 1;
        this.b = values[1] ?? 0;
        this.c = values[2] ?? 0;
        this.d = values[3] ?? 1;
        this.e = values[4] ?? 0;
        this.f = values[5] ?? 0;
      }
      return;
    }

    if (isMatrixObject(init)) {
      this.a = init.a ?? this.a;
      this.b = init.b ?? this.b;
      this.c = init.c ?? this.c;
      this.d = init.d ?? this.d;
      this.e = init.e ?? this.e;
      this.f = init.f ?? this.f;
    }
  }

  multiplySelf(other: MatrixInit): this {
    const o = BasicDOMMatrix.toMatrix(other);
    const { a, b, c, d, e, f } = this;

    this.a = a * o.a + c * o.b;
    this.b = b * o.a + d * o.b;
    this.c = a * o.c + c * o.d;
    this.d = b * o.c + d * o.d;
    this.e = a * o.e + c * o.f + e;
    this.f = b * o.e + d * o.f + f;

    return this;
  }

  preMultiplySelf(other: MatrixInit): this {
    const o = BasicDOMMatrix.toMatrix(other);
    const { a, b, c, d, e, f } = this;

    this.a = o.a * a + o.c * b;
    this.b = o.b * a + o.d * b;
    this.c = o.a * c + o.c * d;
    this.d = o.b * c + o.d * d;
    this.e = o.a * e + o.c * f + o.e;
    this.f = o.b * e + o.d * f + o.f;

    return this;
  }

  multiply(other: MatrixInit): BasicDOMMatrix {
    return this.clone().multiplySelf(other);
  }

  preMultiply(other: MatrixInit): BasicDOMMatrix {
    return this.clone().preMultiplySelf(other);
  }

  translate(tx = 0, ty = 0): this {
    const { a, b, c, d } = this;
    this.e += tx * a + ty * c;
    this.f += tx * b + ty * d;
    return this;
  }

  translateSelf(tx = 0, ty = 0): this {
    return this.translate(tx, ty);
  }

  scale(scaleX = 1, scaleY = scaleX): this {
    this.a *= scaleX;
    this.b *= scaleX;
    this.c *= scaleY;
    this.d *= scaleY;
    return this;
  }

  scaleSelf(scaleX = 1, scaleY = scaleX): this {
    return this.scale(scaleX, scaleY);
  }

  invertSelf(): this {
    const det = this.a * this.d - this.b * this.c;
    if (det === 0) {
      this.reset();
      return this;
    }

    const { a, b, c, d, e, f } = this;
    this.a = d / det;
    this.b = -b / det;
    this.c = -c / det;
    this.d = a / det;
    this.e = (c * f - d * e) / det;
    this.f = (b * e - a * f) / det;
    return this;
  }

  invert(): BasicDOMMatrix {
    return this.clone().invertSelf();
  }

  clone(): BasicDOMMatrix {
    return new BasicDOMMatrix([this.a, this.b, this.c, this.d, this.e, this.f]);
  }

  get is2D(): boolean {
    return true;
  }

  get m11(): number {
    return this.a;
  }

  set m11(value: number) {
    this.a = value;
  }

  get m12(): number {
    return this.b;
  }

  set m12(value: number) {
    this.b = value;
  }

  get m21(): number {
    return this.c;
  }

  set m21(value: number) {
    this.c = value;
  }

  get m22(): number {
    return this.d;
  }

  set m22(value: number) {
    this.d = value;
  }

  get m41(): number {
    return this.e;
  }

  set m41(value: number) {
    this.e = value;
  }

  get m42(): number {
    return this.f;
  }

  set m42(value: number) {
    this.f = value;
  }

  toFloat32Array(): Float32Array {
    return new Float32Array([this.a, this.b, this.c, this.d, this.e, this.f]);
  }

  toString(): string {
    return `matrix(${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.e}, ${this.f})`;
  }

  private reset(): void {
    this.a = 1;
    this.b = 0;
    this.c = 0;
    this.d = 1;
    this.e = 0;
    this.f = 0;
  }
}

class BasicPath2D {
  constructor(_path?: BasicPath2D | string) {}

  addPath(_path: BasicPath2D, _transform?: MatrixInit): void {}

  closePath(): void {}

  moveTo(_x: number, _y: number): void {}

  lineTo(_x: number, _y: number): void {}

  bezierCurveTo(
    _cp1x: number,
    _cp1y: number,
    _cp2x: number,
    _cp2y: number,
    _x: number,
    _y: number
  ): void {}

  quadraticCurveTo(_cpx: number, _cpy: number, _x: number, _y: number): void {}

  arc(
    _x: number,
    _y: number,
    _radius: number,
    _startAngle: number,
    _endAngle: number,
    _counterclockwise?: boolean
  ): void {}

  arcTo(
    _x1: number,
    _y1: number,
    _x2: number,
    _y2: number,
    _radius: number
  ): void {}

  ellipse(
    _x: number,
    _y: number,
    _radiusX: number,
    _radiusY: number,
    _rotation: number,
    _startAngle: number,
    _endAngle: number,
    _counterclockwise?: boolean
  ): void {}

  rect(_x: number, _y: number, _width: number, _height: number): void {}

  roundRect(
    _x: number,
    _y: number,
    _width: number,
    _height: number,
    _radii: number | number[]
  ): void {}
}

class BasicImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  readonly colorSpace = "srgb";

  constructor(width: number, height: number, _settings?: unknown);
  constructor(
    data: Uint8ClampedArray,
    width: number,
    height?: number,
    _settings?: unknown
  );
  constructor(
    dataOrWidth: number | Uint8ClampedArray,
    widthOrHeight: number,
    heightInput?: number,
    _settings?: unknown
  ) {
    if (dataOrWidth instanceof Uint8ClampedArray) {
      const data = dataOrWidth;
      const width = widthOrHeight;
      const height = heightInput ?? Math.floor(data.length / (width * 4));
      this.data = data;
      this.width = width;
      this.height = height;
      return;
    }

    const width = dataOrWidth;
    const height = widthOrHeight;
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }
}

const globalCanvas = globalThis as {
  DOMMatrix?: unknown;
  Path2D?: unknown;
  ImageData?: unknown;
};

export function ensurePdfjsNodePolyfills(): void {
  if (!globalCanvas.DOMMatrix) {
    globalCanvas.DOMMatrix = BasicDOMMatrix;
  }
  if (!globalCanvas.Path2D) {
    globalCanvas.Path2D = BasicPath2D;
  }
  if (!globalCanvas.ImageData) {
    globalCanvas.ImageData = BasicImageData;
  }
}
