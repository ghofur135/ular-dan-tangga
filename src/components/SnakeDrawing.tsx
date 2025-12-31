import React from 'react'
import Svg, { Path, Circle, Ellipse } from 'react-native-svg'

interface SnakeDrawingProps {
  startX: number
  startY: number
  endX: number
  endY: number
  color: string
  cellSize: number
}

/**
 * SnakeDrawing - SVG snake that connects two points on the board
 * Creates a curved snake body with head and eyes
 */
export default function SnakeDrawing({
  startX,
  startY,
  endX,
  endY,
  color,
  cellSize,
}: SnakeDrawingProps) {
  // Calculate control points for curved path
  const midX = (startX + endX) / 2
  const midY = (startY + endY) / 2
  
  // Add some waviness to the snake
  const offsetX = (endX - startX) * 0.3
  const offsetY = (endY - startY) * 0.2
  
  // Create wavy snake path
  const pathD = `
    M ${startX} ${startY}
    Q ${startX + offsetX} ${startY + (endY - startY) * 0.25}
      ${midX - offsetX * 0.5} ${midY - offsetY}
    Q ${midX + offsetX * 0.5} ${midY + offsetY}
      ${endX - offsetX * 0.3} ${endY - (endY - startY) * 0.2}
    L ${endX} ${endY}
  `

  // Stripe color (darker version)
  const stripeColor = color === '#3B82F6' ? '#1E40AF' : 
                      color === '#EF4444' ? '#991B1B' :
                      color === '#F59E0B' ? '#B45309' :
                      color === '#EC4899' ? '#9D174D' : '#166534'

  return (
    <Svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 10,
      }}
    >
      {/* Snake body outline */}
      <Path
        d={pathD}
        stroke="#000"
        strokeWidth={cellSize * 0.22}
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Snake body main color */}
      <Path
        d={pathD}
        stroke={color}
        strokeWidth={cellSize * 0.18}
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Snake stripe pattern */}
      <Path
        d={pathD}
        stroke={stripeColor}
        strokeWidth={cellSize * 0.06}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${cellSize * 0.3} ${cellSize * 0.2}`}
      />
      
      {/* Snake head (at start position - snake head is at top) */}
      <Ellipse
        cx={startX}
        cy={startY}
        rx={cellSize * 0.15}
        ry={cellSize * 0.12}
        fill={color}
        stroke="#000"
        strokeWidth={1.5}
      />
      
      {/* Left eye */}
      <Circle
        cx={startX - cellSize * 0.06}
        cy={startY - cellSize * 0.03}
        r={cellSize * 0.035}
        fill="#FFF"
      />
      <Circle
        cx={startX - cellSize * 0.06}
        cy={startY - cellSize * 0.025}
        r={cellSize * 0.02}
        fill="#000"
      />
      
      {/* Right eye */}
      <Circle
        cx={startX + cellSize * 0.06}
        cy={startY - cellSize * 0.03}
        r={cellSize * 0.035}
        fill="#FFF"
      />
      <Circle
        cx={startX + cellSize * 0.06}
        cy={startY - cellSize * 0.025}
        r={cellSize * 0.02}
        fill="#000"
      />
      
      {/* Tongue */}
      <Path
        d={`M ${startX} ${startY + cellSize * 0.1} 
            L ${startX - cellSize * 0.04} ${startY + cellSize * 0.18}
            M ${startX} ${startY + cellSize * 0.1}
            L ${startX + cellSize * 0.04} ${startY + cellSize * 0.18}`}
        stroke="#E11D48"
        strokeWidth={1.5}
        fill="none"
      />
      
      {/* Snake tail (at end position) */}
      <Path
        d={`M ${endX} ${endY} L ${endX + cellSize * 0.08} ${endY + cellSize * 0.12}`}
        stroke={color}
        strokeWidth={cellSize * 0.08}
        strokeLinecap="round"
      />
    </Svg>
  )
}
