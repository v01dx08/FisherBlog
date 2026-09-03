"use client"

import { useState } from "react"
import { motion } from "framer-motion"

export function AdminLineChart({ data = [] }) {
  const [hoverIndex, setHoverIndex] = useState(null)

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
        Đang tải dữ liệu biểu đồ...
      </div>
    )
  }

  const width = 700
  const height = 240
  const padding = { top: 25, right: 30, bottom: 35, left: 45 }

  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.posts || 0, d.interactions || 0)),
    10
  )
  const minVal = 0

  const getX = (index) => {
    return padding.left + (index / (data.length - 1)) * chartWidth
  }

  const getY = (val) => {
    return height - padding.bottom - ((val - minVal) / (maxVal - minVal)) * chartHeight
  }

  // Generate smooth path curves
  const createPath = (key) => {
    return data.reduce((acc, point, i) => {
      const x = getX(i)
      const y = getY(point[key] || 0)
      return i === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`
    }, "")
  }

  const postsPath = createPath("posts")
  const interactionsPath = createPath("interactions")

  const activePoint = hoverIndex !== null ? data[hoverIndex] : null

  return (
    <div className="w-full relative select-none">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-6 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Bài viết mới</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Lượt tương tác (Like & Comment)</span>
          </div>
        </div>

        {activePoint && (
          <div className="text-xs font-semibold text-primary">
            {activePoint.label}: {activePoint.posts} bài, {activePoint.interactions} tương tác
          </div>
        )}
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio) => {
            const y = padding.top + chartHeight * ratio
            const value = Math.round(maxVal - ratio * maxVal)
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="var(--border)"
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  fontSize="10"
                  textAnchor="end"
                  fill="var(--muted-foreground)"
                  opacity={0.8}
                >
                  {value}
                </text>
              </g>
            )
          })}

          {/* Area fills */}
          <path
            d={`${interactionsPath} L ${getX(data.length - 1)},${height - padding.bottom} L ${getX(0)},${height - padding.bottom} Z`}
            fill="url(#emeraldGradient)"
          />
          <path
            d={`${postsPath} L ${getX(data.length - 1)},${height - padding.bottom} L ${getX(0)},${height - padding.bottom} Z`}
            fill="url(#primaryGradient)"
          />

          {/* Stroke Lines */}
          <path
            d={interactionsPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={postsPath}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* X Axis Labels & Points */}
          {data.map((item, i) => {
            const x = getX(i)
            const yPosts = getY(item.posts || 0)
            const yInter = getY(item.interactions || 0)
            const isHovered = hoverIndex === i

            return (
              <g key={item.date || i}>
                {/* Vertical guide line on hover */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={height - padding.bottom}
                    stroke="var(--primary)"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity={0.8}
                  />
                )}

                {/* Data point circles */}
                <circle
                  cx={x}
                  cy={yInter}
                  r={isHovered ? 5.5 : 3.5}
                  fill="#10b981"
                  stroke="var(--card)"
                  strokeWidth="2"
                  className="transition-all duration-150"
                />
                <circle
                  cx={x}
                  cy={yPosts}
                  r={isHovered ? 6.5 : 4}
                  fill="var(--primary)"
                  stroke="var(--card)"
                  strokeWidth="2.5"
                  className="transition-all duration-150"
                />

                {/* X Axis Label */}
                <text
                  x={x}
                  y={height - padding.bottom + 18}
                  fontSize="11"
                  textAnchor="middle"
                  fill={isHovered ? "var(--foreground)" : "var(--muted-foreground)"}
                  fontWeight={isHovered ? "600" : "400"}
                >
                  {item.label}
                </text>

                {/* Invisible hover trigger column */}
                <rect
                  x={x - chartWidth / (data.length * 2)}
                  y={padding.top}
                  width={chartWidth / data.length}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIndex(i)}
                />
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
