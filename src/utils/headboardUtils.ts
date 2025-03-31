export type HeadboardPosition = 'top' | 'right' | 'bottom' | 'left';

export const getNextHeadboardPosition = (
  current: HeadboardPosition, 
  direction: 'clockwise' | 'counterclockwise'
): HeadboardPosition => {
  const positions: HeadboardPosition[] = ['top', 'right', 'bottom', 'left'];
  const currentIndex = positions.indexOf(current);

  if (direction === 'clockwise') {
    return positions[(currentIndex + 1) % 4];
  } else {
    return positions[(currentIndex + 3) % 4];
  }
};

export const headboardPositionToAngle = (position: HeadboardPosition): number => {
  switch (position) {
    case 'top': return 0;
    case 'right': return 90;
    case 'bottom': return 180;
    case 'left': return 270;
  }
};

export const isVerticalOrientation = (position: HeadboardPosition): boolean => {
  return position === 'top' || position === 'bottom';
};

export const isHeadboardAtStart = (position: HeadboardPosition): boolean => {
  return position === 'top' || position === 'left';
};
