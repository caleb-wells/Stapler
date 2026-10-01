export type Rotation = 0 | 90 | 180 | 270;

export function nextRotation(r: Rotation): Rotation {
  return ((r + 90) % 360) as Rotation;
}

export function rotatedSize(width: number, height: number, rotation: Rotation): { width: number; height: number } {
  return rotation === 90 || rotation === 270 ? { width: height, height: width } : { width, height };
}

/**
 * Where to draw a width×height image so that, after pdf-lib rotates it
 * counter-clockwise by `degrees` about the image's bottom-left corner, it
 * exactly fills a page of rotatedSize(...). `rotation` is clockwise.
 */
export function placementFor(width: number, height: number, rotation: Rotation): { x: number; y: number; degrees: number } {
  switch (rotation) {
    case 0:
      return { x: 0, y: 0, degrees: 0 };
    case 90:
      return { x: 0, y: width, degrees: -90 };
    case 180:
      return { x: width, y: height, degrees: 180 };
    case 270:
      return { x: height, y: 0, degrees: 90 };
  }
}
