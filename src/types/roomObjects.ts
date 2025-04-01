export interface Position {
  top: number;
  left: number;
}

export interface Size {
  width: number;
  length: number;
}

export interface FurnitureObject {
  id: string;
  type: string;
  position: Position;
  size: Size;
  /**
   * The rotation of the furniture object in degrees.
   * Represents the angular orientation of the object relative to its default position.
   * - 0: Default orientation (no rotation).
   * - 90: Rotated 90 degrees clockwise.
   * - 180: Rotated 180 degrees (upside down).
   * - 270: Rotated 270 degrees clockwise (or 90 degrees counterclockwise).
   * Used for rendering and layout calculations.
   */
  rotation: number;
}

export interface BedObject extends FurnitureObject {
  headboardPosition: 'top' | 'right' | 'bottom' | 'left';
  showHeadboard: boolean;
  headboardSize: number;
}

export type FurnitureType = 'bed' | 'table' | 'chair' | 'cabinet';
