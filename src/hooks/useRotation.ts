import { useState, useCallback } from 'react';
import { HeadboardPosition, headboardPositionToAngle } from '../utils/headboardUtils';
import { Dimensions } from '../utils/bedSizes';
import { calculateRotation, createRotationAnimator } from '../utils/rotationUtils';

interface Position {
  top: number;
  left: number;
}

interface UseRotationProps {
  bedSize: Dimensions;
  bedPosition: Position;
  roomDimensions: Dimensions;
  showHeadboard: boolean;
  headboardSize: number;
  onPositionChange: (position: Position) => void;
  onHeadboardPositionChange: (position: HeadboardPosition) => void;
}

/**
 * ROTATION SYSTEM OVERVIEW:
 * This hook encapsulates the bed rotation system which:
 * 1. Manages the rotation state (isRotating, animationRotation)
 * 2. Calculates position changes during rotation
 * 3. Animates the rotation with smooth transitions
 * 4. Updates parent component with new position and orientation
 *
 * The rotation system uses logical orientation (via headboardPosition)
 * combined with temporary CSS transforms during animation for a smooth
 * visual experience.
 *
 * Instead of directly changing the CSS transform permanently, we:
 * - Control the smooth transition between rotation states
 * - Handle the content counter-rotation separately from the container
 * - Calculate and adjust the bed position appropriately after rotation
 */
const useRotation = ({
  bedSize,
  bedPosition,
  roomDimensions,
  showHeadboard,
  headboardSize,
  onPositionChange,
  onHeadboardPositionChange
}: UseRotationProps) => {
  // Track if a rotation animation is currently in progress
  const [isRotating, setIsRotating] = useState<boolean>(false);
  
  // Current rotation angle during animation
  const [animationRotation, setAnimationRotation] = useState<number>(0);

  /**
   * Main rotation function that handles both the animation and logic of rotation
   * 
   * This function:
   * 1. Calculates the next headboard position based on rotation direction
   * 2. Determines how dimensions will change after rotation
   * 3. Computes the new position to keep the bed centered after rotation
   * 4. Runs the smooth animation using requestAnimationFrame
   * 5. Updates the parent component when rotation is complete
   */
  const rotateBed = useCallback((
    direction: 'clockwise' | 'counterclockwise', 
    currentHeadboardPosition: HeadboardPosition
  ) => {
    if (isRotating) return;

    setIsRotating(true);

    // Use the rotation utility to calculate all necessary values
    const {
      newHeadboardPosition,
      startAngle,
      rotationAmount,
      adjustedLeft,
      adjustedTop
    } = calculateRotation(
      direction,
      currentHeadboardPosition,
      bedSize,
      bedPosition,
      roomDimensions,
      showHeadboard,
      headboardSize
    );

    // Set initial animation rotation angle
    setAnimationRotation(startAngle);

    // Create and start the animation
    const animate = createRotationAnimator(
      startAngle,
      rotationAmount,
      // Progress callback - updates the rotation angle during animation
      (angle) => {
        setAnimationRotation(angle);
      },
      // Complete callback - finalizes the rotation by updating position and orientation
      () => {
        onHeadboardPositionChange(newHeadboardPosition);
        onPositionChange({ left: adjustedLeft, top: adjustedTop });
        
        // Small delay before allowing another rotation to prevent rapid multiple rotations
        setTimeout(() => {
          setIsRotating(false);
        }, 100);
      }
    );

    // Start the animation
    requestAnimationFrame(animate);
  }, [
    isRotating, 
    bedSize, 
    bedPosition, 
    roomDimensions, 
    showHeadboard, 
    headboardSize, 
    onPositionChange,
    onHeadboardPositionChange
  ]);

  return {
    isRotating,
    animationRotation,
    rotateBed
  };
};

export default useRotation;
