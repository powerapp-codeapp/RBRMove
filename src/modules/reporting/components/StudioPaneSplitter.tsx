import React, { useState } from 'react';

export interface StudioPaneSplitterProps {
  onMouseDown: (e: React.MouseEvent) => void;
  isDragging?: boolean;
}

export const StudioPaneSplitter: React.FC<StudioPaneSplitterProps> = ({
  onMouseDown,
  isDragging = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Click and drag to adjust width"
      style={{
        width: '6px',
        marginLeft: '-3px',
        marginRight: '-3px',
        backgroundColor: 'transparent',
        position: 'relative',
        cursor: 'col-resize',
        zIndex: 20,
        flexShrink: 0,
        height: '100%',
      }}
    >
      {/* Interactive Adjust-Width Separator (visible on hover or drag) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '2px',
          width: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDragging || isHovered ? '#000099' : 'transparent',
          transition: 'background-color 0.15s ease',
        }}
      >
        <div
          style={{
            width: '2px',
            height: '24px',
            borderRadius: '1px',
            backgroundColor: '#ffffff',
            opacity: isDragging || isHovered ? 1 : 0,
            transition: 'opacity 0.15s ease',
          }}
        />
      </div>
    </div>
  );
};

export default StudioPaneSplitter;

