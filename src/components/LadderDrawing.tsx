import React from 'react'
import Svg, { Line, Rect } from 'react-native-svg'

interface LadderDrawingProps {
  startX: number
  startY: number
  endX: number
  endY: number
  cellSize: number
}

/**
 * LadderDrawing - SVG ladder that connects two points on the board
 * Creates a wooden-style ladder with rails and rungs
 */
export default function LadderDrawing({
  startX,
  startY,
  endX,
  endY,
  cellSize,
}: LadderDrawingProps) {
  // Ladder dimensions
  const ladderWidth = cellSize * 0.35
  const railWidth = cellSize * 0.06
  const rungHeight = cellSize * 0.04
  
  // Calculate angle and length
  const dx = endX - startX
  const dy = endY - startY
  const length = Math.sqrt(dx * dx + dy * dy)
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)
  
  // Number of rungs based on length
  const numRungs = Math.max(3, Math.floor(length / (cellSize * 0.4)))
  const rungSpacing = length / (numRungs + 1)
  
  // Calculate perpendicular offset for ladder width
  const perpX = (-dy / length) * (ladderWidth / 2)
  const perpY = (dx / length) * (ladderWidth / 2)
  
  // Rail positions
  const leftRailStart = { x: startX + perpX, y: startY + perpY }
  const leftRailEnd = { x: endX + perpX, y: endY + perpY }
  const rightRailStart = { x: startX - perpX, y: startY - perpY }
  const rightRailEnd = { x: endX - perpX, y: endY - perpY }
  
  // Generate rung positions
  const rungs = []
  for (let i = 1; i <= numRungs; i++) {
    const t = i / (numRungs + 1)
    const rungX = startX + dx * t
    const rungY = startY + dy * t
    rungs.push({
      x1: rungX + perpX,
      y1: rungY + perpY,
      x2: rungX - perpX,
      y2: rungY - perpY,
    })
  }

  // Colors
  const railColor = '#1F4E3D'  // Dark green
  const railShadow = '#0F2E23'
  const rungColor = '#2D6A4F'
  const rungShadow = '#1B4332'

  return (
    <Svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 5,
      }}
    >
      {/* Left rail shadow */}
      <Line
        x1={leftRailStart.x + 2}
        y1={leftRailStart.y + 2}
        x2={leftRailEnd.x + 2}
        y2={leftRailEnd.y + 2}
        stroke={railShadow}
        strokeWidth={railWidth + 2}
        strokeLinecap="round"
      />
      
      {/* Right rail shadow */}
      <Line
        x1={rightRailStart.x + 2}
        y1={rightRailStart.y + 2}
        x2={rightRailEnd.x + 2}
        y2={rightRailEnd.y + 2}
        stroke={railShadow}
        strokeWidth={railWidth + 2}
        strokeLinecap="round"
      />
      
      {/* Left rail */}
      <Line
        x1={leftRailStart.x}
        y1={leftRailStart.y}
        x2={leftRailEnd.x}
        y2={leftRailEnd.y}
        stroke={railColor}
        strokeWidth={railWidth}
        strokeLinecap="round"
      />
      
      {/* Right rail */}
      <Line
        x1={rightRailStart.x}
        y1={rightRailStart.y}
        x2={rightRailEnd.x}
        y2={rightRailEnd.y}
        stroke={railColor}
        strokeWidth={railWidth}
        strokeLinecap="round"
      />
      
      {/* Rungs */}
      {rungs.map((rung, index) => (
        <React.Fragment key={index}>
          {/* Rung shadow */}
          <Line
            x1={rung.x1 + 1}
            y1={rung.y1 + 2}
            x2={rung.x2 + 1}
            y2={rung.y2 + 2}
            stroke={rungShadow}
            strokeWidth={rungHeight + 1}
            strokeLinecap="round"
          />
          {/* Rung */}
          <Line
            x1={rung.x1}
            y1={rung.y1}
            x2={rung.x2}
            y2={rung.y2}
            stroke={rungColor}
            strokeWidth={rungHeight}
            strokeLinecap="round"
          />
        </React.Fragment>
      ))}
    </Svg>
  )
}
