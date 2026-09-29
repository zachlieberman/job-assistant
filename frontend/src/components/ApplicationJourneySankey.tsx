import { useEffect, useRef } from 'react'
import { useContainerWidth } from '../hooks/useContainerWidth'
import { select } from 'd3-selection'
import { sankey, sankeyLinkHorizontal, SankeyNode as D3SankeyNode, SankeyLink as D3SankeyLink } from 'd3-sankey'
import { SankeyData } from '../api/client'
import { STATUS_META, statusLabel } from '../lib/statusMeta'

/** Same blue ramp as the status badges; "active" (still in flight) is a neutral slate. */
const STATUS_COLORS: Record<string, string> = {
  active: '#4A5163',
  applied: STATUS_META.applied.mark,
  phone_screen: STATUS_META.phone_screen.mark,
  technical: STATUS_META.technical.mark,
  offer: STATUS_META.offer.mark,
  rejected: STATUS_META.rejected.mark,
}

export function journeyLabel(name: string): string {
  return name === 'active' ? 'Active' : statusLabel(name)
}

const LABEL_COLOR = '#E6E8EE'

interface Props {
  data: SankeyData
  width?: number
  height?: number
}

export default function ApplicationJourneySankey({ data, width: defaultWidth = 700, height = 340 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const { ref: containerRef, width } = useContainerWidth<HTMLDivElement>(defaultWidth)

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return
    const svg = select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 16, right: width < 520 ? 118 : 150, bottom: 16, left: 10 }
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
      .attr('stroke', (d) => STATUS_COLORS[(d.source as N).name] ?? '#6E7688')
      .attr('stroke-width', (d) => Math.max(1, d.width ?? 1))
      .attr('opacity', 0.5)

    const node = g.append('g')
      .selectAll('g')
      .data(graph.nodes as N[])
      .join('g')

    node.append('rect')
      .attr('x', (d) => d.x0 ?? 0)
      .attr('y', (d) => d.y0 ?? 0)
      .attr('width', (d) => (d.x1 ?? 0) - (d.x0 ?? 0))
      .attr('height', (d) => Math.max(1, (d.y1 ?? 0) - (d.y0 ?? 0)))
      .attr('fill', (d) => STATUS_COLORS[d.name] ?? '#6E7688')
      .attr('rx', 3)

    node.append('text')
      .attr('x', (d) => (d.x1 ?? 0) + 6)
      .attr('y', (d) => ((d.y0 ?? 0) + (d.y1 ?? 0)) / 2)
      .attr('dy', '0.35em')
      .attr('font-size', 13)
      .attr('fill', LABEL_COLOR)
      .text((d) => {
        const label = journeyLabel(d.name)
        const val = (d.value ?? 0)
        return `${label} (${val})`
      })
  }, [data, width, height])

  if (!data.nodes.length) {
    return (
      <div className="flex h-32 items-center justify-center text-center text-sm text-muted">
        No journey data yet. Change an application’s status and its path will appear here.
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full">
      <svg
        ref={svgRef}
        role="img"
        aria-label="Sankey diagram of how applications move between stages. The same data is listed in the table below."
        width={width}
        height={height}
        className="w-full"
        viewBox={`0 0 ${width} ${height}`}
      />
    </div>
  )
}
