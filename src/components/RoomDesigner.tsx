import React, { useState, useEffect, useRef } from 'react';
import './RoomDesigner.css';
import { Dimensions, getBedDisplayName, getBedSizeById, BED_SIZES } from '../utils/bedSizes';
import { 
  HeadboardPosition, 
  headboardPositionToAngle,
  isVerticalOrientation,
  isHeadboardAtStart
} from '../utils/headboardUtils';
import BedComponent from './BedComponent';
import useRotation from '../hooks/useRotation';

interface Position {
  top: number;
  left: number;
}

/**
 * The main component for room design functionality
 * 
 * Allows users to:
 * - Set room dimensions
 * - Select bed size
 * - Toggle and configure headboard
 * - Rotate and drag the bed within the room
 * 
 * ROTATION SYSTEM OVERVIEW:
 * The bed rotation is managed through the useRotation hook which:
 * 1. Tracks the state of rotation (isRotating, animationRotation)
 * 2. Handles the calculation of new positions after rotation
 * 3. Controls the animation flow using requestAnimationFrame
 * 4. Updates the parent component with new positions and orientations
 * 
 * This separation of concerns keeps the component code cleaner while
 * maintaining the smooth animation and proper positioning logic.
 */
const RoomDesigner: React.FC = () => {
  const [roomDimensions, setRoomDimensions] = useState<Dimensions>({
    width: 305,
    length: 366
  });

  const [bedSize, setBedSize] = useState<Dimensions>({
    width: 90,
    length: 190
  });

  const [bedPosition, setBedPosition] = useState<Position>({ top: 0, left: 0 });
  const [bedSizeId, setBedSizeId] = useState<string>('single');
  const [showHeadboard, setShowHeadboard] = useState<boolean>(true);
  const [headboardSize, setHeadboardSize] = useState<number>(15);
  const [headboardPosition, setHeadboardPosition] = useState<HeadboardPosition>('top');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragPreviewPosition, setDragPreviewPosition] = useState<Position | null>(null);
  const [dragOffsetRef, setDragOffsetRef] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [touchStartPos, setTouchStartPos] = useState<{ x: number, y: number } | null>(null);
  const roomPreviewRef = useRef<HTMLDivElement>(null);
  const bedRef = useRef<HTMLDivElement>(null);

  // Use the rotation hook for managing rotation state and animation
  const { isRotating, animationRotation, rotateBed } = useRotation({
    bedSize,
    bedPosition,
    roomDimensions,
    showHeadboard,
    headboardSize,
    onPositionChange: setBedPosition,
    onHeadboardPositionChange: setHeadboardPosition
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRoomDimensions(prev => ({
      ...prev,
      [name]: Number(value)
    }));
  };

  const handleHeadboardToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowHeadboard(e.target.checked);
  };

  const handleHeadboardSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHeadboardSize(Number(e.target.value));
  };

  const handleBedSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sizeId = e.target.value;
    setBedSizeId(sizeId);
    
    try {
      const bedSizeData = getBedSizeById(sizeId);
      setBedSize(bedSizeData.dimensions);
    } catch (error) {
      console.error("Error setting bed size:", error);
    }
  };

  const calculatePosition = React.useCallback((clientX: number, clientY: number, offsetX: number, offsetY: number): Position | null => {
    const roomPreview = roomPreviewRef.current;
    if (!roomPreview) return null;

    const roomRect = roomPreview.getBoundingClientRect();

    const positionPixelX = clientX - roomRect.left - offsetX;
    const positionPixelY = clientY - roomRect.top - offsetY;

    const scaleX = roomDimensions.width / roomRect.width;
    const scaleY = roomDimensions.length / roomRect.height;

    const positionCmX = positionPixelX * scaleX;
    const positionCmY = positionPixelY * scaleY;

    const isVertical = isVerticalOrientation(headboardPosition);
    const actualWidth = isVertical ? bedSize.width : bedSize.length;
    const actualLength = isVertical ? bedSize.length : bedSize.width;
    const headboardAtStart = isHeadboardAtStart(headboardPosition);
    const totalLength = showHeadboard && headboardAtStart ? actualLength + headboardSize : actualLength;

    const clampedX = Math.max(0, Math.min(positionCmX, roomDimensions.width - actualWidth));
    const clampedY = Math.max(0, Math.min(positionCmY, roomDimensions.length - totalLength));

    return {
      left: clampedX,
      top: clampedY
    };
  }, [roomDimensions, bedSize, headboardPosition, showHeadboard, headboardSize]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    const bedRect = e.currentTarget.getBoundingClientRect();

    const offsetX = e.clientX - bedRect.left;
    const offsetY = e.clientY - bedRect.top;

    e.dataTransfer.setData('offsetX', offsetX.toString());
    e.dataTransfer.setData('offsetY', offsetY.toString());
    setDragOffsetRef({ x: offsetX, y: offsetY });

    setIsDragging(true);

    const dragImage = new Image();
    dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(dragImage, 0, 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragPreviewPosition(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const { x: offsetX, y: offsetY } = dragOffsetRef;

    const newPosition = calculatePosition(e.clientX, e.clientY, offsetX, offsetY);
    if (newPosition) {
      setDragPreviewPosition(newPosition);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    let offsetX, offsetY;
    try {
      offsetX = parseInt(e.dataTransfer.getData('offsetX'), 10);
      offsetY = parseInt(e.dataTransfer.getData('offsetY'), 10);
    } catch (error) {
      offsetX = dragOffsetRef.x;
      offsetY = dragOffsetRef.y;
    }

    if (isNaN(offsetX) || isNaN(offsetY)) {
      offsetX = dragOffsetRef.x;
      offsetY = dragOffsetRef.y;
    }

    const newPosition = calculatePosition(e.clientX, e.clientY, offsetX, offsetY);
    if (newPosition) {
      setBedPosition(newPosition);
    }

    setIsDragging(false);
    setDragPreviewPosition(null);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isRotating) return;

    const touch = e.touches[0];
    const bedRect = e.currentTarget.getBoundingClientRect();

    const offsetX = touch.clientX - bedRect.left;
    const offsetY = touch.clientY - bedRect.top;

    setDragOffsetRef({ x: offsetX, y: offsetY });
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !touchStartPos || isRotating) return;

    const touch = e.touches[0];
    const { x: offsetX, y: offsetY } = dragOffsetRef;

    const newPosition = calculatePosition(touch.clientX, touch.clientY, offsetX, offsetY);
    if (newPosition) {
      setDragPreviewPosition(newPosition);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !touchStartPos) return;

    if (e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const { x: offsetX, y: offsetY } = dragOffsetRef;

      const newPosition = calculatePosition(touch.clientX, touch.clientY, offsetX, offsetY);
      if (newPosition) {
        setBedPosition(newPosition);
      }
    }

    setIsDragging(false);
    setTouchStartPos(null);
    setDragPreviewPosition(null);
  };

  useEffect(() => {
    const bedElement = bedRef.current;
    if (!bedElement) return;

    const options = { passive: false };

    const touchMoveHandler = (e: TouchEvent) => {
      if (!isDragging || !touchStartPos || isRotating) return;
      e.preventDefault();

      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const { x: offsetX, y: offsetY } = dragOffsetRef;

        const newPosition = calculatePosition(touch.clientX, touch.clientY, offsetX, offsetY);
        if (newPosition) {
          setDragPreviewPosition(newPosition);
        }
      }
    };

    bedElement.addEventListener('touchmove', touchMoveHandler, options);

    return () => {
      bedElement.removeEventListener('touchmove', touchMoveHandler);
    };
  }, [isDragging, touchStartPos, isRotating, calculatePosition, dragOffsetRef]);

  const handleRotateClockwise = (e: React.MouseEvent) => {
    e.stopPropagation();
    rotateBed('clockwise', headboardPosition);
  };

  const handleRotateCounterClockwise = (e: React.MouseEvent) => {
    e.stopPropagation();
    rotateBed('counterclockwise', headboardPosition);
  };

  const getBedContainerStyle = () => {
    const isVertical = isVerticalOrientation(headboardPosition);
    const width = isVertical ? bedSize.width : bedSize.length;
    const length = isVertical ? bedSize.length : bedSize.width;

    const headboardAtEnd = headboardPosition === 'bottom' || headboardPosition === 'right';
    const headboardAtStart = isHeadboardAtStart(headboardPosition);

    let totalLength = length;
    if (showHeadboard) {
      if (headboardAtStart || headboardAtEnd) {
        totalLength += headboardSize;
      }
    }

    // The transform property is only applied during rotation animation
    // When not rotating, no transform is needed as we're using logical positioning
    const transform = isRotating ? `rotate(${animationRotation - headboardPositionToAngle(headboardPosition)}deg)` : '';

    return {
      width: `${(width / roomDimensions.width) * 100}%`,
      height: `${(totalLength / roomDimensions.length) * 100}%`,
      top: `${(bedPosition.top / roomDimensions.length) * 100}%`,
      left: `${(bedPosition.left / roomDimensions.width) * 100}%`,
      position: 'absolute' as const,
      transform,
      transformOrigin: 'center center', // Ensure rotation happens around the center
      display: 'block',
      cursor: isDragging ? 'grabbing' : 'grab',
      opacity: isDragging ? 0.4 : 1,
    };
  };

  const getDragPreviewStyle = () => {
    if (!dragPreviewPosition) return { display: 'none' };

    const isVertical = isVerticalOrientation(headboardPosition);
    const width = isVertical ? bedSize.width : bedSize.length;
    const length = isVertical ? bedSize.length : bedSize.width;

    const headboardAtEnd = headboardPosition === 'bottom' || headboardPosition === 'right';
    const headboardAtStart = isHeadboardAtStart(headboardPosition);

    let totalLength = length;
    if (showHeadboard) {
      if (headboardAtStart || headboardAtEnd) {
        totalLength += headboardSize;
      }
    }

    const transform = isRotating ? `rotate(${animationRotation - headboardPositionToAngle(headboardPosition)}deg)` : '';

    return {
      width: `${(width / roomDimensions.width) * 100}%`,
      height: `${(totalLength / roomDimensions.length) * 100}%`,
      top: `${(dragPreviewPosition.top / roomDimensions.length) * 100}%`,
      left: `${(dragPreviewPosition.left / roomDimensions.width) * 100}%`,
      position: 'absolute' as const,
      transformOrigin: 'center center',
      display: 'block',
      opacity: 0.7,
      backgroundColor: 'rgba(30, 144, 255, 0.3)',
      border: '2px dashed #0056b3',
      boxSizing: 'border-box',
      zIndex: 100,
      transform,
      pointerEvents: 'none',
    };
  };

  useEffect(() => {
    const isVertical = isVerticalOrientation(headboardPosition);
    const actualWidth = isVertical ? bedSize.width : bedSize.length;
    const actualLength = isVertical ? bedSize.length : bedSize.width;

    const headboardAtStart = isHeadboardAtStart(headboardPosition);
    const totalLength = showHeadboard && headboardAtStart ? actualLength + headboardSize : actualLength;

    setBedPosition(prev => ({
      left: Math.min(prev.left, Math.max(0, roomDimensions.width - actualWidth)),
      top: Math.min(prev.top, Math.max(0, roomDimensions.length - totalLength))
    }));
  }, [bedSize, roomDimensions, headboardPosition, showHeadboard, headboardSize]);

  return (
    <div className="room-designer">
      <h2>Design Your Room</h2>

      <div className="room-controls">
        <div className="control-section">
          <h3>Room</h3>
          <div className="dimension-control">
            <label>Width (cm):
              <input
                type="number"
                name="width"
                value={roomDimensions.width}
                onChange={handleInputChange}
                min="30"
              />
            </label>
          </div>

          <div className="dimension-control">
            <label>Length (cm):
              <input
                type="number"
                name="length"
                value={roomDimensions.length}
                onChange={handleInputChange}
                min="30"
              />
            </label>
          </div>
        </div>

        <div className="control-section">
          <h3>Bed</h3>
          <div className="dimension-control">
            <label>Bed Size:
              <select value={bedSizeId} onChange={handleBedSizeChange}>
                {BED_SIZES.map(size => (
                  <option key={size.id} value={size.id}>
                    {size.name} ({size.dimensions.width} cm × {size.dimensions.length} cm)
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="dimension-control headboard-control">
            <div className="checkbox-wrapper">
              <input
                type="checkbox"
                id="headboard-toggle"
                checked={showHeadboard}
                onChange={handleHeadboardToggle}
              />
              <label htmlFor="headboard-toggle">Show Headboard</label>
            </div>

            {showHeadboard && (
              <div className="headboard-size-control">
                <label>Headboard Size (cm):
                  <input
                    type="number"
                    value={headboardSize}
                    onChange={handleHeadboardSizeChange}
                    min="5"
                    max="50"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className="room-preview-container"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="room-display-container">
          <div
            ref={roomPreviewRef}
            className="room-preview"
            style={{
              aspectRatio: `${roomDimensions.width} / ${roomDimensions.length}`
            }}
          >
            <p>Room Preview</p>
            {isDragging && dragPreviewPosition && (
              <div
                className="bed-drag-preview"
                style={getDragPreviewStyle()}
              >
                <div className="drag-preview-content">
                  <div className="drag-preview-text">{getBedDisplayName(bedSizeId)}</div>
                </div>
              </div>
            )}
            <div
              ref={bedRef}
              className={`bed-container ${isRotating ? 'rotating' : ''} ${isDragging ? 'dragging' : ''}`}
              draggable={!isRotating}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              style={getBedContainerStyle()}
            >
              <BedComponent 
                bedSizeId={bedSizeId}
                headboardPosition={headboardPosition}
                isRotating={isRotating}
                animationRotation={animationRotation}
                showHeadboard={showHeadboard}
                headboardSize={headboardSize}
                onRotateClockwise={handleRotateClockwise}
                onRotateCounterClockwise={handleRotateCounterClockwise}
              />
            </div>
            <div className="room-dimensions">
              {roomDimensions.width} cm × {roomDimensions.length} cm
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDesigner;
