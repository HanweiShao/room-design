import React, { useState } from 'react';
import './RoomDesigner.css';

function RoomDesigner() {
  const [roomDimensions, setRoomDimensions] = useState({
    width: 10,
    length: 12,
    height: 8
  });
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRoomDimensions(prev => ({
      ...prev,
      [name]: Number(value)
    }));
  };
  
  return (
    <div className="room-designer">
      <h2>Design Your Room</h2>
      
      <div className="room-controls">
        <div className="dimension-control">
          <label>Width (ft): 
            <input 
              type="number" 
              name="width" 
              value={roomDimensions.width} 
              onChange={handleInputChange} 
              min="1"
            />
          </label>
        </div>
        
        <div className="dimension-control">
          <label>Length (ft): 
            <input 
              type="number" 
              name="length" 
              value={roomDimensions.length} 
              onChange={handleInputChange}
              min="1"
            />
          </label>
        </div>
        
        <div className="dimension-control">
          <label>Height (ft): 
            <input 
              type="number" 
              name="height" 
              value={roomDimensions.height} 
              onChange={handleInputChange}
              min="1"
            />
          </label>
        </div>
      </div>
      
      <div className="room-preview" style={{
        width: `${roomDimensions.width * 20}px`,
        height: `${roomDimensions.length * 20}px`
      }}>
        <p>Room Preview</p>
        <div className="room-dimensions">
          {roomDimensions.width} ft × {roomDimensions.length} ft × {roomDimensions.height} ft
        </div>
      </div>
    </div>
  );
}

export default RoomDesigner;
