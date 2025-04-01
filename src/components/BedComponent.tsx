import React from 'react';
import BaseFurniture, { BaseFurnitureProps } from './Furniture/BaseFurniture';
import { Orientation, OrientationHelper } from '../utils/orientationUtils';
import { getBedDisplayName } from '../utils/bedSizes';

interface BedComponentProps extends Omit<BaseFurnitureProps, 'type'> {
  bedSizeId: string;
  headboardPosition: Orientation;
  showHeadboard: boolean;
  headboardSize: number;
}

const BedComponent: React.FC<BedComponentProps> = ({
  bedSizeId,
  headboardPosition,
  isRotating,
  animationRotation,
  showHeadboard,
  headboardSize,
  ...baseFurnitureProps
}) => {
  const animationClass = isRotating ? 'rotating' : '';
  
  // COUNTER-ROTATION FOR CONTENT:
  // During rotation, we need to counter-rotate the bed content (text and buttons)
  // to keep it upright and readable regardless of bed orientation.
  // This is achieved by applying a counter-rotation to the bed-content div that
  // is equal and opposite to the main rotation being applied to the bed container.
  const contentRotation = isRotating ? -(animationRotation - OrientationHelper.orientationToAngle(headboardPosition)) : 0;

  // Determine the CSS class based on bed orientation to control flex direction
  // This allows us to position headboard correctly based on orientation
  let orientationClass = '';
  switch (headboardPosition) {
    case 'top': orientationClass = 'north-orientation'; break; // Headboard at top, flex column
    case 'right': orientationClass = 'east-orientation'; break; // Headboard at right, flex row-reverse
    case 'bottom': orientationClass = 'south-orientation'; break; // Headboard at bottom, flex column-reverse
    case 'left': orientationClass = 'west-orientation'; break; // Headboard at left, flex row
  }

  // The rotation controls that appear in all positions
  // These controls trigger the rotation animation via callback props
  const RotationControls = () => (
    <div className="rotation-controls">
      <button className="rotate-btn rotate-counterclockwise" onClick={baseFurnitureProps.onRotateCounterClockwise}>↺</button>
      <button className="rotate-btn rotate-clockwise" onClick={baseFurnitureProps.onRotateClockwise}>↻</button>
    </div>
  );

  // The bed content with text and rotation controls
  // Note the transform style that applies counter-rotation during animation
  const BedContent = () => (
    <div className="bed-content" style={{ transform: `rotate(${contentRotation}deg)` }}>
      <div className="bed-text">{getBedDisplayName(bedSizeId)}</div>
      <RotationControls />
    </div>
  );

  // We render different layouts based on headboard position
  // Each layout ensures proper positioning of bed and headboard elements
  // while maintaining the ability to animate rotation smoothly

  // For bottom position, put the headboard at the end (after the bed)
  const BottomLayout = () => (
    <div className={orientationClass} style={{ width: '100%', height: '100%', flexDirection: 'column' }}>
      <div className={`bed ${animationClass}`} style={{ flex: 1, width: '100%' }}>
        <BedContent />
      </div>
      {showHeadboard && (
        <div className={`headboard ${animationClass}`} style={{ height: `${headboardSize}px`, width: '100%' }}>
          <span className="headboard-label">South</span>
        </div>
      )}
    </div>
  );

  // Top position with headboard
  const TopLayout = () => (
    <div className={orientationClass} style={{ width: '100%', height: '100%', flexDirection: 'column' }}>
      {showHeadboard && (
        <div className={`headboard ${animationClass}`} style={{ height: `${headboardSize}px`, width: '100%' }}>
          <span className="headboard-label">North</span>
        </div>
      )}
      <div className={`bed ${animationClass}`} style={{ flex: 1, width: '100%' }}>
        <BedContent />
      </div>
    </div>
  );

  // Left position with headboard
  const LeftLayout = () => (
    <div className={orientationClass} style={{ width: '100%', height: '100%', flexDirection: 'row' }}>
      {showHeadboard && (
        <div className={`headboard headboard-side ${animationClass}`} style={{ width: `${headboardSize}px`, height: '100%' }}>
          <span className="headboard-label">West</span>
        </div>
      )}
      <div className={`bed ${animationClass}`} style={{ flex: 1, height: '100%' }}>
        <BedContent />
      </div>
    </div>
  );

  // Right position with headboard
  const RightLayout = () => (
    <div className={orientationClass} style={{ width: '100%', height: '100%', flexDirection: 'row' }}>
      <div className={`bed ${animationClass}`} style={{ flex: 1, height: '100%' }}>
        <BedContent />
      </div>
      {showHeadboard && (
        <div className={`headboard headboard-side ${animationClass}`} style={{ width: `${headboardSize}px`, height: '100%' }}>
          <span className="headboard-label">East</span>
        </div>
      )}
    </div>
  );

  // Default case - just the bed without headboard
  const DefaultLayout = () => (
    <div className={orientationClass} style={{ width: '100%', height: '100%' }}>
      <div className={`bed ${animationClass}`} style={{ width: '100%', height: '100%' }}>
        <BedContent />
      </div>
    </div>
  );

  return (
    <BaseFurniture
      type="bed"
      isRotating={isRotating}
      animationRotation={animationRotation}
      {...baseFurnitureProps}
      style={{ width: '100%', height: '100%' }}
    >
      {headboardPosition === 'bottom' && <BottomLayout />}
      {headboardPosition === 'top' && showHeadboard && <TopLayout />}
      {headboardPosition === 'left' && showHeadboard && <LeftLayout />}
      {headboardPosition === 'right' && showHeadboard && <RightLayout />}
      {!showHeadboard && <DefaultLayout />}
    </BaseFurniture>
  );
};

export default BedComponent;
