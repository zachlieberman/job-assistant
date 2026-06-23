import { useEffect, useRef } from 'react'
import { select } from 'd3-selection'
import { sankey, sankeyLinkHorizontal, SankeyNode as D3SankeyNode, SankeyLink as D3SankeyLink } from 'd3-sankey'
import { SankeyData } from '../api/client'

const STATUS_COLORS: Record<string, string> = {
  active: '#475569',
  applied: '#60a5fa',
  phone_screen: '#a78bfa',
  technical: '#f59e0b',
  offer: '#34d399',
  rejected: '#f87171',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  applied: 'Applied',
  phone_screen: 'Phone Screen',
  technical: 'Technical',
  offer: 'Offer',
  rejected: 'Rejected',
}

interface Props {
  data: SankeyData
  width?: number
  height?: number
}

export default function ApplicationJourneySankey({ data, width = 700, height = 340 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return
    const svg = select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 16, right: 140, bottom: 16, left: 10 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    type N = D3SankeyNode<{ name: string }, object>
    type L = D3SankeyLink<{ name: string }, object>

    const STATUS_ORDER = ['applied', 'phone_screen', 'technical', 'offer', 'rejected', 'active']
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
      .attr('stroke', (d) => STATUS_COLORS[(d.source as N).name] ?? '#cbd5e1')
      .attr('stroke-width', (d) => Math.max(1, d.width ?? 1))
      .attr('opacity', 0.45)

    const node = g.append('g')
      .selectAll('g')
      .data(graph.nodes as N[])
      .join('g')

    node.append('rect')
      .attr('x', (d) => d.x0 ?? 0)
      .attr('y', (d) => d.y0 ?? 0)
      .attr('width', (d) => (d.x1 ?? 0) - (d.x0 ?? 0))
      .attr('height', (d) => Math.max(1, (d.y1 ?? 0) - (d.y0 ?? 0)))
      .attr('fill', (d) => STATUS_COLORS[d.name] ?? '#94a3b8')
      .attr('rx', 3)

    node.append('text')
      .attr('x', (d) => (d.x1 ?? 0) + 6)
      .attr('y', (d) => ((d.y0 ?? 0) + (d.y1 ?? 0)) / 2)
      .attr('dy', '0.35em')
      .attr('font-size', 12)
      .attr('fill', '#e2e8f0')
      .text((d) => {
        const label = STATUS_LABELS[d.name] ?? d.name
        const val = (d.value ?? 0)
        return `${label} (${val})`
      })
  }, [data, width, height])

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
