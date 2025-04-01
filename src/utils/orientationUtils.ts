export type Orientation = 'top' | 'right' | 'bottom' | 'left';

/**
 * A helper object for orientation-related utilities.
 */
export const OrientationHelper = {
  /**
   * Get the next orientation based on the current orientation and rotation direction.
   */
  getNextOrientation: (
    current: Orientation,
    direction: 'clockwise' | 'counterclockwise'
  ): Orientation => {
    const positions: Orientation[] = ['top', 'right', 'bottom', 'left'];
    const currentIndex = positions.indexOf(current);

    if (direction === 'clockwise') {
      return positions[(currentIndex + 1) % 4];
    } else {
      return positions[(currentIndex + 3) % 4];
    }
  },

  /**
   * Convert an orientation to its corresponding angle in degrees.
   */
  orientationToAngle: (position: Orientation): number => {
    switch (position) {
      case 'top': return 0;
      case 'right': return 90;
      case 'bottom': return 180;
      case 'left': return 270;
    }
  },

  /**
   * Check if the orientation is vertical (top or bottom).
   * 
   * Purpose:
   * This function determines whether the given head position
   * corresponds to a vertical orientation. In this context:
   * - "top" and "bottom" are considered vertical orientations.
   * 
   * This is useful for layout logic, determining axis alignment,
   * or applying specific styles or behaviors based on orientation.
   */
  isVerticalOrientation: (headPosition: Orientation): boolean => {
    return headPosition === 'top' || headPosition === 'bottom';
  },

  /**
   * Check if the orientation is at the start (top or left).
   * 
   * Purpose:
   * This function is used to identify whether the given head position
   * is at the "start" of a layout or coordinate system. In this context:
   * - "top" is considered the start of the vertical axis.
   * - "left" is considered the start of the horizontal axis.
   * 
   * This is useful for determining layout adjustments, positioning logic,
   * or applying specific styles or behaviors based on the head position.
   */
  isOrientationAtStart: (headPosition: Orientation): boolean => {
    return headPosition === 'top' || headPosition === 'left';
  }
};
