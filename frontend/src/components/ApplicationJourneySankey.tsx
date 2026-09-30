import { useEffect, useRef } from 'react'
import { select } from 'd3-selection'
import { sankey, sankeyLinkHorizontal, SankeyNode as D3SankeyNode, SankeyLink as D3SankeyLink } from 'd3-sankey'
import type { SankeyData } from '../api/client'

export const STATUS_COLORS: Record<string, string> = {
  active: '#475569',
  applied: '#60a5fa',
  recruiter_screen: '#a78bfa',
  interview: '#f59e0b',
  final_interview: '#fb923c',
  offer: '#34d399',
  rejected: '#f87171',
}

export const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  applied: 'Applied',
  recruiter_screen: 'Recruiter Screen',
  interview: 'Interview',
  final_interview: 'Final Interview',
  offer: 'Offer',
  rejected: 'Rejected',
}

/** Pointer or focus position (viewport px) plus the text to show in a tooltip. */
export interface SankeyHover {
  text: string
  x: number
  y: number
}

interface Props {
  data: SankeyData
  width?: number
  height?: number
  /** Overrides for the built-in status colors. */
  colors?: Record<string, string>
  labelColor?: string
  labels?: Record<string, string>
  fontSize?: number
  linkOpacity?: number
  /** Right-hand space reserved for node labels. */
  labelSpace?: number
  /** When set, nodes become keyboard focusable and report hover/focus. */
  onHover?: (hover: SankeyHover | null) => void
}

function hoverAt(event: Event, text: string): SankeyHover {
  if (event instanceof MouseEvent) return { text, x: event.clientX, y: event.clientY }
  const box = (event.currentTarget as Element).getBoundingClientRect()
  return { text, x: box.left + box.width / 2, y: box.top }
}

export default function ApplicationJourneySankey({
  data,
  width = 700,
  height = 340,
  colors,
  labelColor = '#e2e8f0',
  labels,
  fontSize = 12,
  linkOpacity = 0.45,
  labelSpace = 140,
  onHover,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const onHoverRef = useRef(onHover)
  onHoverRef.current = onHover
  const palette = colors ? { ...STATUS_COLORS, ...colors } : STATUS_COLORS
  const paletteKey = JSON.stringify(palette)
  const names = labels ? { ...STATUS_LABELS, ...labels } : STATUS_LABELS
  const namesKey = JSON.stringify(names)

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return
    const svg = select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 16, right: labelSpace, bottom: 16, left: 10 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    type N = D3SankeyNode<{ name: string }, object>
    type L = D3SankeyLink<{ name: string }, object>

    const STATUS_ORDER = ['applied', 'recruiter_screen', 'interview', 'final_interview', 'offer', 'rejected', 'active']
    const rank = (name: string) => {
      const i = STATUS_ORDER.indexOf(name)
      return i === -1 ? STATUS_ORDER.length : i
    }

    // Remove back-edges (cycles) so d3-sankey doesn't throw
    const forwardLinks = data.links.filter(
      (l) => rank(data.nodes[l.source].name) < rank(data.nodes[l.target].name)
    )

    // Only include nodes that appear in forward links
    const usedNodeIndices = new Set(forwardLinks.flatMap((l) => [l.source, l.target]))
    const nodeRemap = new Map<number, number>()
    const filteredNodes = data.nodes
      .map((n, i) => ({ n, i }))
      .filter(({ i }) => usedNodeIndices.has(i))
      .map(({ n, i }, newIdx) => { nodeRemap.set(i, newIdx); return { ...n } })

    const remappedLinks = forwardLinks.map((l) => ({
      ...l,
      source: nodeRemap.get(l.source)!,
      target: nodeRemap.get(l.target)!,
    }))

    if (!filteredNodes.length) return

    const layout = sankey<{ name: string }, object>()
      .nodeWidth(18)
      .nodePadding(14)
      .extent([[0, 0], [innerW, innerH]])

    const graph = layout({ nodes: filteredNodes, links: remappedLinks })

    g.append('g')
      .selectAll('path')
      .data(graph.links as L[])
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('fill', 'none')
      .attr('stroke', (d) => palette[(d.source as N).name] ?? '#cbd5e1')
      .attr('stroke-width', (d) => Math.max(1, d.width ?? 1))
      .attr('opacity', linkOpacity)
      .on('pointerenter', (event, d) => {
        const from = names[(d.source as N).name] ?? (d.source as N).name
        const to = names[(d.target as N).name] ?? (d.target as N).name
        onHoverRef.current?.(hoverAt(event, `${from} to ${to}: ${d.value}`))
      })
      .on('pointerleave', () => onHoverRef.current?.(null))

    const node = g.append('g')
      .selectAll('g')
      .data(graph.nodes as N[])
      .join('g')

    if (onHoverRef.current) {
      const describe = (d: N) => `${names[d.name] ?? d.name}: ${d.value ?? 0}`
      node
        .attr('class', 'sankey-node')
        .attr('tabindex', 0)
        .attr('role', 'img')
        .attr('aria-label', (d) => describe(d))
        .on('pointerenter focus', (event, d) => onHoverRef.current?.(hoverAt(event, describe(d))))
        .on('pointerleave blur', () => onHoverRef.current?.(null))
    }

    node.append('rect')
      .attr('x', (d) => d.x0 ?? 0)
      .attr('y', (d) => d.y0 ?? 0)
      .attr('width', (d) => (d.x1 ?? 0) - (d.x0 ?? 0))
      .attr('height', (d) => Math.max(1, (d.y1 ?? 0) - (d.y0 ?? 0)))
      .attr('fill', (d) => palette[d.name] ?? '#94a3b8')
      .attr('rx', 3)

    node.append('text')
      .attr('x', (d) => (d.x1 ?? 0) + 6)
      .attr('y', (d) => ((d.y0 ?? 0) + (d.y1 ?? 0)) / 2)
      .attr('dy', '0.35em')
      .attr('font-size', fontSize)
      .attr('fill', labelColor)
      .text((d) => {
        const label = names[d.name] ?? d.name
        const val = (d.value ?? 0)
        return `${label} (${val})`
      })
  }, [data, width, height, paletteKey, namesKey, labelColor, labelSpace, fontSize, linkOpacity])

  if (!data.nodes.length) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
        No journey data yet — status changes will appear here.
      </div>
    )
  }

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="w-full"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
    />
  )
}
