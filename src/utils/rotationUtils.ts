import { HeadboardPosition, headboardPositionToAngle, getNextHeadboardPosition, isVerticalOrientation, isHeadboardAtStart } from './headboardUtils';
import { Dimensions } from './bedSizes';

interface Position {
  top: number;
  left: number;
}

interface RotationCalculationResult {
  newHeadboardPosition: HeadboardPosition;
  startAngle: number;
  rotationAmount: number;
  adjustedLeft: number;
  adjustedTop: number;
}

/**
 * DIMENSION HANDLING DURING ROTATION:
 * When rotating a bed, we have to handle several complexity factors:
 * 1. The bed's width and length dimensions get swapped during rotation
 * 2. The headboard might change from affecting width to affecting length
 * 3. We need to rotate around the center point to maintain visual continuity
 * 4. After rotation, we need to ensure the bed stays within room boundaries
 * 
 * This function calculates all the necessary values for a rotation but
 * doesn't modify any state directly. Instead, it returns values that the
 * component can use to update its own state.
 */
export const calculateRotation = (
  direction: 'clockwise' | 'counterclockwise',
  headboardPosition: HeadboardPosition,
  bedSize: Dimensions,
  bedPosition: Position,
  roomDimensions: { width: number, length: number },
  showHeadboard: boolean,
  headboardSize: number
): RotationCalculationResult => {
  // Calculate the next position after rotation
  const newHeadboardPosition = getNextHeadboardPosition(headboardPosition, direction);

  // Get the starting angle for the animation
  const startAngle = headboardPositionToAngle(headboardPosition);
  
  // Determine rotation amount
  const rotationAmount = direction === 'clockwise' ? 90 : -90; // Degrees to rotate

  // Check if current and new orientations are vertical (top/bottom) or horizontal (left/right)
  const isCurrentVertical = isVerticalOrientation(headboardPosition);
  const isNewVertical = isVerticalOrientation(newHeadboardPosition);

  // Determine the current dimensions based on orientation
  const currentWidth = isCurrentVertical ? bedSize.width : bedSize.length;
  const currentLength = isCurrentVertical ? bedSize.length : bedSize.width;

  // Account for headboard in dimension calculations
  const isHeadboardAffectingLength = showHeadboard && (headboardPosition === 'top' || headboardPosition === 'bottom');
  const isHeadboardAtStartOfLayout = isHeadboardAtStart(headboardPosition);

  let currentTotalLength = currentLength;
  if (showHeadboard) {
    if ((isCurrentVertical && isHeadboardAtStartOfLayout) ||
      (!isCurrentVertical && isHeadboardAffectingLength)) {
      currentTotalLength += headboardSize;
    }
  }

  // Calculate the center point of the bed - this is the pivot for rotation
  const centerX = bedPosition.left + (currentWidth / 2);
  const centerY = bedPosition.top + (currentTotalLength / 2);

  // Calculate new dimensions after rotation
  const newWidth = isNewVertical ? bedSize.width : bedSize.length;
  const newLength = isNewVertical ? bedSize.length : bedSize.width;

  // Account for headboard in new dimensions
  const willHeadboardAffectLength = showHeadboard && (newHeadboardPosition === 'top' || newHeadboardPosition === 'bottom');
  const willHeadboardBeAtStart = isHeadboardAtStart(newHeadboardPosition);

  let newTotalLength = newLength;
  if (showHeadboard) {
    if ((isNewVertical && willHeadboardBeAtStart) ||
      (!isNewVertical && willHeadboardAffectLength)) {
      newTotalLength += headboardSize;
    }
  }

  // Calculate new position to keep bed centered after rotation while ensuring it stays within bounds
  const adjustedLeft = Math.max(0, Math.min(centerX - (newWidth / 2), roomDimensions.width - newWidth));
  const adjustedTop = Math.max(0, Math.min(centerY - (newTotalLength / 2), roomDimensions.length - newTotalLength));

  return {
    newHeadboardPosition,
    startAngle,
    rotationAmount,
    adjustedLeft,
    adjustedTop
  };
};

/**
 * ANIMATION SYSTEM:
 * This function creates an animation that smoothly rotates elements
 * using requestAnimationFrame for optimal performance.
 * 
 * The animation:
 * 1. Calculates progress based on time elapsed
 * 2. Applies easing function for natural motion
 * 3. Updates the rotation angle incrementally
 * 4. Calls completion callback when finished
 * 
 * This animation approach separates the calculation from rendering,
 * allowing for smooth visual transitions while keeping the underlying
 * data model clean.
 */
export const createRotationAnimator = (
  startAngle: number,
  rotationAmount: number,
  onProgress: (angle: number) => void,
  onComplete: () => void,
  duration = 300
) => {
  const startTime = performance.now();
  
  // Animation frame callback that updates the rotation angle
  const animate = (timestamp: number) => {
    // Calculate animation progress (0 to 1)
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Apply easing function for smooth acceleration/deceleration
    const easedProgress = 0.5 - Math.cos(progress * Math.PI) / 2;

    // Calculate current angle during animation
    const currentAngle = startAngle + (rotationAmount * easedProgress);
    onProgress(currentAngle);

    if (progress < 1) {
      // Continue animation if not complete
      requestAnimationFrame(animate);
    } else {
      // Animation complete
      onComplete();
    }
  };

  return animate;
};
