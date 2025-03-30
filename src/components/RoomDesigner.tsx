import React, { useState, useEffect } from 'react';
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

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    const bedRect = e.currentTarget.getBoundingClientRect();
    e.dataTransfer.setData('dragStartX', (e.clientX - bedRect.left).toString());
    e.dataTransfer.setData('dragStartY', (e.clientY - bedRect.top).toString());
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dragStartX = parseInt(e.dataTransfer.getData('dragStartX'), 10);
    const dragStartY = parseInt(e.dataTransfer.getData('dragStartY'), 10);

    const roomRect = e.currentTarget.getBoundingClientRect();
    const dropX = e.clientX - roomRect.left - dragStartX;
    const dropY = e.clientY - roomRect.top - dragStartY;

    const isVertical = headboardPosition === 'top' || headboardPosition === 'bottom';
    const actualWidth = isVertical ? bedSize.width : bedSize.length;
    const actualLength = isVertical ? bedSize.length : bedSize.width;
    const headboardAtStart = headboardPosition === 'top' || headboardPosition === 'left';
    const totalLength = showHeadboard && headboardAtStart ? actualLength + headboardSize : actualLength;

    setBedPosition({
      left: Math.max(0, Math.min(dropX, roomDimensions.width - actualWidth)),
      top: Math.max(0, Math.min(dropY, roomDimensions.length - totalLength))
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

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
    console.log(`Rotating from ${headboardPosition} to ${newHeadboardPosition}`);

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
        console.log(`Animation complete, setting headboard position to: ${newHeadboardPosition}`);
        setHeadboardPosition(newHeadboardPosition);
        setBedPosition({ left: adjustedLeft, top: adjustedTop });
        setTimeout(() => {
          console.log("Animation finished, headboard should now be at:", newHeadboardPosition);
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
    };
  };

  const renderBed = () => {
    const animationClass = isRotating ? 'rotating' : '';
    const contentRotation = isRotating ? -(animationRotation - headboardPositionToAngle(headboardPosition)) : 0;

    console.log(`Rendering with headboard position: ${headboardPosition}`);

    let orientationClass = '';
    switch(headboardPosition) {
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
    switch(bedSizeId) {
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
            className="room-preview"
            style={{
              aspectRatio: `${roomDimensions.width} / ${roomDimensions.length}`
            }}
          >
            <p>Room Preview</p>
            <div
              className={`bed-container ${isRotating ? 'rotating' : ''}`}
              draggable={!isRotating}
              onDragStart={handleDragStart}
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
