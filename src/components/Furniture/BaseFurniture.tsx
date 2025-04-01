import React from 'react';
import { Position, Size } from '../../types/roomObjects';

export interface BaseFurnitureProps {
  id: string;
  type: string;
  size: Size;
  position: Position;
  isRotating: boolean;
  isDragging: boolean;
  animationRotation: number;
  onRotateClockwise: (e: React.MouseEvent) => void;
  onRotateCounterClockwise: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
  onTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: (e: React.TouchEvent<HTMLDivElement>) => void;
  style?: React.CSSProperties;
}

const BaseFurniture: React.FC<BaseFurnitureProps> = ({
  type,
  isRotating,
  isDragging,
  animationRotation,
  onRotateClockwise,
  onRotateCounterClockwise,
  style,
  children
}) => {
  const RotationControls = () => (
    <div className="rotation-controls">
      <button className="rotate-btn rotate-counterclockwise" onClick={onRotateCounterClockwise}>↺</button>
      <button className="rotate-btn rotate-clockwise" onClick={onRotateClockwise}>↻</button>
    </div>
  );

  const FurnitureContent = () => (
    <div className="furniture-content" style={{ transform: `rotate(${-animationRotation}deg)` }}>
      <div className="furniture-text">{type}</div>
      <RotationControls />
    </div>
  );

  return (
    <div 
      className={`furniture ${type} ${isRotating ? 'rotating' : ''} ${isDragging ? 'dragging' : ''}`}
      style={style}
    >
      {children || <FurnitureContent />}
    </div>
  );
};

export default BaseFurniture;
