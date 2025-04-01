import { useState, useCallback } from 'react';
import { Orientation } from '../utils/orientationUtils';
import { Dimensions } from '../utils/bedSizes';
import { calculateRotation, createRotationAnimator } from '../utils/rotationUtils';

interface Position {
  top: number;
  left: number;
}

interface UseRotationProps {
  furnitureSize: Dimensions;
  furniturePosition: Position;
  roomDimensions: Dimensions;
  hasHead?: boolean; // Whether the furniture has a "head" object (e.g., bedhead)
  headSize?: number; // Size of the "head" object
  onPositionChange: (position: Position) => void;
  onOrientationChange: (orientation: Orientation) => void;
}

/**
 * ROTATION SYSTEM OVERVIEW:
 * This hook encapsulates the furniture rotation system which:
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
 * - Calculate and adjust the furniture position appropriately after rotation
 */
const useRotation = ({
  furnitureSize,
  furniturePosition,
  roomDimensions,
  hasHead = false,
  headSize = 0,
  onPositionChange,
  onOrientationChange
}: UseRotationProps) => {
  // Track if a rotation animation is currently in progress
  const [isRotating, setIsRotating] = useState<boolean>(false);
  
  // Current rotation angle during animation
  const [animationRotation, setAnimationRotation] = useState<number>(0);

  /**
   * Main rotation function that handles both the animation and logic of rotation
   * 
   * This function:
   * 1. Calculates the next orientation based on rotation direction
   * 2. Determines how dimensions will change after rotation
   * 3. Computes the new position to keep the furniture centered after rotation
   * 4. Runs the smooth animation using requestAnimationFrame
   * 5. Updates the parent component when rotation is complete
   */
  const rotateFurniture = useCallback((
    direction: 'clockwise' | 'counterclockwise', 
    currentOrientation: Orientation
  ) => {
    if (isRotating) return;

    setIsRotating(true);

    // Use the rotation utility to calculate all necessary values
    const {
      newOrientation,
      startAngle,
      rotationAmount,
      adjustedLeft,
      adjustedTop
    } = calculateRotation(
      direction,
      currentOrientation,
      furnitureSize,
      furniturePosition,
      roomDimensions,
      hasHead,
      headSize
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
        onOrientationChange(newOrientation);
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
    furnitureSize, 
    furniturePosition, 
    roomDimensions, 
    hasHead, 
    headSize, 
    onPositionChange,
    onOrientationChange
  ]);

  return {
    isRotating,
    animationRotation,
    rotateFurniture
  };
};

export default useRotation;
