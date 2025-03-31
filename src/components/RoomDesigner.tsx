import React, { useState, useEffect, useRef } from 'react';
import './RoomDesigner.css';

interface Dimensions {
  width: number;
  length: number;
}

interface Position {
  top: number;
  left: number;
}

// Define a type for headboard position
type HeadboardPosition = 'top' | 'right' | 'bottom' | 'left';

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
  const [showHeadboard, setShowHeadboard] = useState<boolean>(true); // Changed to true by default
  const [headboardSize, setHeadboardSize] = useState<number>(15);
  const [headboardPosition, setHeadboardPosition] = useState<HeadboardPosition>('top');
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [animationRotation, setAnimationRotation] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragPreviewPosition, setDragPreviewPosition] = useState<Position | null>(null);
  const [dragOffsetRef, setDragOffsetRef] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [touchStartPos, setTouchStartPos] = useState<{ x: number, y: number } | null>(null);
  const roomPreviewRef = useRef<HTMLDivElement>(null);
  const bedRef = useRef<HTMLDivElement>(null);

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
    const size = e.target.value;
    setBedSizeId(size);
    if (size === 'single') {
      setBedSize({ width: 90, length: 190 });
    } else if (size === 'double') {
      setBedSize({ width: 135, length: 190 });
    } else if (size === 'queen') {
      setBedSize({ width: 150, length: 200 });
    } else if (size === 'king') {
      setBedSize({ width: 180, length: 200 });
    }
  };

  // Unified calculation function that works for both mouse and touch events
  const calculatePosition = React.useCallback((clientX: number, clientY: number, offsetX: number, offsetY: number): Position | null => {
    const roomPreview = roomPreviewRef.current;
    if (!roomPreview) return null;

    const roomRect = roomPreview.getBoundingClientRect();

    // Calculate the position in pixels, adjusting for the offset
    const positionPixelX = clientX - roomRect.left - offsetX;
    const positionPixelY = clientY - roomRect.top - offsetY;

    // Calculate scale conversion between pixels and centimeters
    const scaleX = roomDimensions.width / roomRect.width;
    const scaleY = roomDimensions.length / roomRect.height;

    // Convert from pixels to centimeters in room coordinates
    const positionCmX = positionPixelX * scaleX;
    const positionCmY = positionPixelY * scaleY;

    // Apply constraints based on bed orientation and headboard
    const isVertical = headboardPosition === 'top' || headboardPosition === 'bottom';
    const actualWidth = isVertical ? bedSize.width : bedSize.length;
    const actualLength = isVertical ? bedSize.length : bedSize.width;
    const headboardAtStart = headboardPosition === 'top' || headboardPosition === 'left';
    const totalLength = showHeadboard && headboardAtStart ? actualLength + headboardSize : actualLength;

    // Ensure the bed stays within the room boundaries
    const clampedX = Math.max(0, Math.min(positionCmX, roomDimensions.width - actualWidth));
    const clampedY = Math.max(0, Math.min(positionCmY, roomDimensions.length - totalLength));

    return {
      left: clampedX,
      top: clampedY
    };
  }, [roomDimensions, bedSize, headboardPosition, showHeadboard, headboardSize]);

  // Updated drag handlers to use unified calculation function
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    const bedRect = e.currentTarget.getBoundingClientRect();

    // Calculate the offset from the mouse position to the top-left corner of the bed
    const offsetX = e.clientX - bedRect.left;
    const offsetY = e.clientY - bedRect.top;

    // Store offset in both data transfer and component state for reliability
    e.dataTransfer.setData('offsetX', offsetX.toString());
    e.dataTransfer.setData('offsetY', offsetY.toString());
    setDragOffsetRef({ x: offsetX, y: offsetY });

    setIsDragging(true);

    // Set a custom drag image if needed (optional)
    const dragImage = new Image();
    dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // Transparent 1x1 pixel
    e.dataTransfer.setDragImage(dragImage, 0, 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragPreviewPosition(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Get offsets from state since dataTransfer can't be accessed during dragOver in some browsers
    const { x: offsetX, y: offsetY } = dragOffsetRef;

    // Calculate new position
    const newPosition = calculatePosition(e.clientX, e.clientY, offsetX, offsetY);
    if (newPosition) {
      setDragPreviewPosition(newPosition);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    // Try to get from dataTransfer first, fallback to state
    let offsetX, offsetY;
    try {
      offsetX = parseInt(e.dataTransfer.getData('offsetX'), 10);
      offsetY = parseInt(e.dataTransfer.getData('offsetY'), 10);
    } catch (error) {
      // Fallback to the stored ref if dataTransfer fails
      offsetX = dragOffsetRef.x;
      offsetY = dragOffsetRef.y;
    }

    // Ensure we have valid offsets
    if (isNaN(offsetX) || isNaN(offsetY)) {
      offsetX = dragOffsetRef.x;
      offsetY = dragOffsetRef.y;
    }

    // Calculate final position
    const newPosition = calculatePosition(e.clientX, e.clientY, offsetX, offsetY);
    if (newPosition) {
      setBedPosition(newPosition);
    }

    // Clean up
    setIsDragging(false);
    setDragPreviewPosition(null);
  };

  // Touch handlers using the same unified calculation
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isRotating) return;

    const touch = e.touches[0];
    const bedRect = e.currentTarget.getBoundingClientRect();

    // Calculate offset from touch position to bed's top-left corner
    const offsetX = touch.clientX - bedRect.left;
    const offsetY = touch.clientY - bedRect.top;

    // Store the offset for use during move
    setDragOffsetRef({ x: offsetX, y: offsetY });
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    // We don't call preventDefault here anymore
    // The actual prevention happens in the useEffect's non-passive event listener
    if (!isDragging || !touchStartPos || isRotating) return;

    const touch = e.touches[0];
    const { x: offsetX, y: offsetY } = dragOffsetRef;

    // Use the same calculation function as for mouse events
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

      // Use the same calculation function for the final position
      const newPosition = calculatePosition(touch.clientX, touch.clientY, offsetX, offsetY);
      if (newPosition) {
        setBedPosition(newPosition);
      }
    }

    setIsDragging(false);
    setTouchStartPos(null);
    setDragPreviewPosition(null);
  };

  // Non-passive touch event handler in useEffect
  useEffect(() => {
    const bedElement = bedRef.current;
    if (!bedElement) return;

    // Options for the event listeners - non-passive to allow preventDefault
    const options = { passive: false };

    // Function to handle touch move with non-passive option
    const touchMoveHandler = (e: TouchEvent) => {
      if (!isDragging || !touchStartPos || isRotating) return;
      e.preventDefault(); // Prevent scrolling

      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const { x: offsetX, y: offsetY } = dragOffsetRef;

        // Use the same calculation function
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

  const getNextHeadboardPosition = (current: HeadboardPosition, direction: 'clockwise' | 'counterclockwise'): HeadboardPosition => {
    const positions: HeadboardPosition[] = ['top', 'right', 'bottom', 'left'];
    const currentIndex = positions.indexOf(current);

    if (direction === 'clockwise') {
      return positions[(currentIndex + 1) % 4];
    } else {
      return positions[(currentIndex + 3) % 4];
    }
  };

  const headboardPositionToAngle = (position: HeadboardPosition): number => {
    switch (position) {
      case 'top': return 0;
      case 'right': return 90;
      case 'bottom': return 180;
      case 'left': return 270;
    }
  };

  const rotateBed = (direction: 'clockwise' | 'counterclockwise') => {
    if (isRotating) return;

    setIsRotating(true); // Set this first to prevent any race conditions

    const newHeadboardPosition = getNextHeadboardPosition(headboardPosition, direction);

    const startAngle = headboardPositionToAngle(headboardPosition);
    setAnimationRotation(startAngle);

    const isCurrentVertical = headboardPosition === 'top' || headboardPosition === 'bottom';
    const isNewVertical = newHeadboardPosition === 'top' || newHeadboardPosition === 'bottom';

    const currentWidth = isCurrentVertical ? bedSize.width : bedSize.length;
    const currentLength = isCurrentVertical ? bedSize.length : bedSize.width;

    const isHeadboardAffectingLength = showHeadboard && (headboardPosition === 'top' || headboardPosition === 'bottom');
    const isHeadboardAtStartOfLayout = showHeadboard && (headboardPosition === 'top' || headboardPosition === 'left');

    let currentTotalLength = currentLength;
    if (showHeadboard) {
      if ((isCurrentVertical && isHeadboardAtStartOfLayout) ||
        (!isCurrentVertical && isHeadboardAffectingLength)) {
        currentTotalLength += headboardSize;
      }
    }

    const centerX = bedPosition.left + (currentWidth / 2);
    const centerY = bedPosition.top + (currentTotalLength / 2);

    const newWidth = isNewVertical ? bedSize.width : bedSize.length;
    const newLength = isNewVertical ? bedSize.length : bedSize.width;

    const willHeadboardAffectLength = showHeadboard && (newHeadboardPosition === 'top' || newHeadboardPosition === 'bottom');
    const willHeadboardBeAtStart = showHeadboard && (newHeadboardPosition === 'top' || newHeadboardPosition === 'left');

    let newTotalLength = newLength;
    if (showHeadboard) {
      if ((isNewVertical && willHeadboardBeAtStart) ||
        (!isNewVertical && willHeadboardAffectLength)) {
        newTotalLength += headboardSize;
      }
    }

    const adjustedLeft = Math.max(0, Math.min(centerX - (newWidth / 2), roomDimensions.width - newWidth));
    const adjustedTop = Math.max(0, Math.min(centerY - (newTotalLength / 2), roomDimensions.length - newTotalLength));

    const animationDuration = 300;
    const startTime = performance.now();
    const rotationAmount = direction === 'clockwise' ? 90 : -90;

    const animate = (timestamp: number) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      const easedProgress = 0.5 - Math.cos(progress * Math.PI) / 2;

      const currentAngle = startAngle + (rotationAmount * easedProgress);
      setAnimationRotation(currentAngle);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setHeadboardPosition(newHeadboardPosition);
        setBedPosition({ left: adjustedLeft, top: adjustedTop });
        setTimeout(() => {
          setIsRotating(false);
        }, 100);
      }
    };

    requestAnimationFrame(animate);
  };

  const handleRotateClockwise = (e: React.MouseEvent) => {
    e.stopPropagation();
    rotateBed('clockwise');
  };

  const handleRotateCounterClockwise = (e: React.MouseEvent) => {
    e.stopPropagation();
    rotateBed('counterclockwise');
  };

  const getBedContainerStyle = () => {
    const isVertical = headboardPosition === 'top' || headboardPosition === 'bottom';
    const width = isVertical ? bedSize.width : bedSize.length;
    const length = isVertical ? bedSize.length : bedSize.width;

    const headboardAtEnd = headboardPosition === 'bottom' || headboardPosition === 'right';
    const headboardAtStart = headboardPosition === 'top' || headboardPosition === 'left';

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
      top: `${(bedPosition.top / roomDimensions.length) * 100}%`,
      left: `${(bedPosition.left / roomDimensions.width) * 100}%`,
      position: 'absolute' as const,
      transform,
      transformOrigin: 'center center',
      display: 'block',
      cursor: isDragging ? 'grabbing' : 'grab',
      opacity: isDragging ? 0.4 : 1, // Make the original bed more transparent during drag
    };
  };

  // Get style for the drag preview element
  const getDragPreviewStyle = () => {
    if (!dragPreviewPosition) return { display: 'none' };

    const isVertical = headboardPosition === 'top' || headboardPosition === 'bottom';
    const width = isVertical ? bedSize.width : bedSize.length;
    const length = isVertical ? bedSize.length : bedSize.width;

    const headboardAtEnd = headboardPosition === 'bottom' || headboardPosition === 'right';
    const headboardAtStart = headboardPosition === 'top' || headboardPosition === 'left';

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

  const renderBed = () => {
    const animationClass = isRotating ? 'rotating' : '';
    const contentRotation = isRotating ? -(animationRotation - headboardPositionToAngle(headboardPosition)) : 0;

    let orientationClass = '';
    switch (headboardPosition) {
      case 'top': orientationClass = 'north-orientation'; break;
      case 'right': orientationClass = 'east-orientation'; break;
      case 'bottom': orientationClass = 'south-orientation'; break;
      case 'left': orientationClass = 'west-orientation'; break;
    }

    // For bottom position, put the headboard at the end (after the bed)
    if (headboardPosition === 'bottom') {
      return (
        <div className={orientationClass} style={{ width: '100%', height: '100%' }}>
          <div className={`bed ${animationClass}`} style={{ flex: 1 }}>
            <div className="bed-content" style={{ transform: `rotate(${contentRotation}deg)` }}>
              <div className="bed-text">{getBedDisplayName()}</div>
              <div className="rotation-controls">
                <button className="rotate-btn rotate-counterclockwise" onClick={handleRotateCounterClockwise}>↺</button>
                <button className="rotate-btn rotate-clockwise" onClick={handleRotateClockwise}>↻</button>
              </div>
            </div>
          </div>
          {showHeadboard && (
            <div className={`headboard ${animationClass}`} style={{ height: `${headboardSize}px` }}>
              <span className="headboard-label">South</span>
            </div>
          )}
        </div>
      );
    }

    // Keep the original rendering for other positions
    if (headboardPosition === 'top' && showHeadboard) {
      return (
        <div className={orientationClass} style={{ width: '100%', height: '100%' }}>
          <div className={`headboard ${animationClass}`} style={{ height: `${headboardSize}px` }}>
            <span className="headboard-label">North</span>
          </div>
          <div className={`bed ${animationClass}`} style={{ flex: 1 }}>
            <div className="bed-content" style={{ transform: `rotate(${contentRotation}deg)` }}>
              <div className="bed-text">{getBedDisplayName()}</div>
              <div className="rotation-controls">
                <button className="rotate-btn rotate-counterclockwise" onClick={handleRotateCounterClockwise}>↺</button>
                <button className="rotate-btn rotate-clockwise" onClick={handleRotateClockwise}>↻</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (headboardPosition === 'left' && showHeadboard) {
      return (
        <div className={orientationClass} style={{ width: '100%', height: '100%' }}>
          <div className={`headboard headboard-side ${animationClass}`} style={{ width: `${headboardSize}px` }}>
            <span className="headboard-label">West</span>
          </div>
          <div className={`bed ${animationClass}`} style={{ flex: 1 }}>
            <div className="bed-content" style={{ transform: `rotate(${contentRotation}deg)` }}>
              <div className="bed-text">{getBedDisplayName()}</div>
              <div className="rotation-controls">
                <button className="rotate-btn rotate-counterclockwise" onClick={handleRotateCounterClockwise}>↺</button>
                <button className="rotate-btn rotate-clockwise" onClick={handleRotateClockwise}>↻</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (headboardPosition === 'right' && showHeadboard) {
      return (
        <div className={orientationClass} style={{ width: '100%', height: '100%' }}>
          <div className={`bed ${animationClass}`} style={{ flex: 1 }}>
            <div className="bed-content" style={{ transform: `rotate(${contentRotation}deg)` }}>
              <div className="bed-text">{getBedDisplayName()}</div>
              <div className="rotation-controls">
                <button className="rotate-btn rotate-counterclockwise" onClick={handleRotateCounterClockwise}>↺</button>
                <button className="rotate-btn rotate-clockwise" onClick={handleRotateClockwise}>↻</button>
              </div>
            </div>
          </div>
          <div className={`headboard headboard-side ${animationClass}`} style={{ width: `${headboardSize}px` }}>
            <span className="headboard-label">East</span>
          </div>
        </div>
      );
    }

    return (
      <div className={orientationClass} style={{ width: '100%', height: '100%' }}>
        <div className={`bed ${animationClass}`} style={{ flex: 1 }}>
          <div className="bed-content" style={{ transform: `rotate(${contentRotation}deg)` }}>
            <div className="bed-text">{getBedDisplayName()}</div>
            <div className="rotation-controls">
              <button className="rotate-btn rotate-counterclockwise" onClick={handleRotateCounterClockwise}>↺</button>
              <button className="rotate-btn rotate-clockwise" onClick={handleRotateClockwise}>↻</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getBedDisplayName = () => {
    switch (bedSizeId) {
      case 'single': return 'Single Bed';
      case 'double': return 'Double Bed';
      case 'queen': return 'Queen Bed';
      case 'king': return 'King Bed';
      default: return bedSizeId;
    }
  };

  useEffect(() => {
    const isVertical = headboardPosition === 'top' || headboardPosition === 'bottom';
    const actualWidth = isVertical ? bedSize.width : bedSize.length;
    const actualLength = isVertical ? bedSize.length : bedSize.width;

    const headboardAtStart = headboardPosition === 'top' || headboardPosition === 'left';
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
              <select onChange={handleBedSizeChange}>
                <option value="single">Single Bed (90 cm × 190 cm)</option>
                <option value="double">Double Bed (135 cm × 190 cm)</option>
                <option value="queen">Queen Bed (150 cm × 200 cm)</option>
                <option value="king">King Bed (180 cm × 200 cm)</option>
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
            {/* The drag preview element */}
            {isDragging && dragPreviewPosition && (
              <div
                className="bed-drag-preview"
                style={getDragPreviewStyle()}
              >
                <div className="drag-preview-content">
                  <div className="drag-preview-text">{getBedDisplayName()}</div>
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
              {renderBed()}
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
