import { Component, ElementRef, input, effect, inject, viewChild } from '@angular/core';
import * as d3 from 'd3';
import { ProcessNode, ProcessLink } from '../../models/event-log.model';
import { ProcessDataService } from '../../services/process-data.service';

interface D3Node extends ProcessNode, d3.SimulationNodeDatum {
    x: number;
    y: number;
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
    frequency: number;
    avgDuration: number;
    source: D3Node | string;
    target: D3Node | string;
}

@Component({
    selector: 'app-process-graph',
    standalone: true,
    templateUrl: './process-graph.component.html',
    styleUrl: './process-graph.component.scss'
})
export class ProcessGraphComponent {
    nodes = input.required<ProcessNode[]>();
    links = input.required<ProcessLink[]>();

    private readonly dataService = inject(ProcessDataService);
    private readonly chartRef = viewChild.required<ElementRef<SVGSVGElement>>('chart');

    private simulation: d3.Simulation<D3Node, D3Link> | null = null;

    constructor() {
        effect(() => {
            const nodes = this.nodes();
            const links = this.links();
            const svg = this.chartRef().nativeElement;
            this.selectedActivity(); // Track selection changes
            if (nodes.length > 0 && svg) {
                this.renderChart(nodes, links);
            }
        });
    }

    private selectedActivity = () => this.dataService.selectedActivity();

    private renderChart(nodes: ProcessNode[], links: ProcessLink[]): void {
        const svg = d3.select(this.chartRef().nativeElement);
        svg.selectAll('*').remove();

        const container = this.chartRef().nativeElement.parentElement;
        const width = container?.clientWidth || 500;
        const height = Math.max(350, container?.clientHeight ? container.clientHeight - 80 : 350);

        svg.attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        // Create arrow marker for directed edges
        const defs = svg.append('defs');
        defs.append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 20)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', 'var(--link-color)');

        // Prepare D3 nodes and links
        const d3Nodes: D3Node[] = nodes.map(n => ({ ...n, x: width / 2, y: height / 2 }));
        const nodeById = new Map(d3Nodes.map(n => [n.id, n]));

        const d3Links: D3Link[] = links.map(l => ({
            source: nodeById.get(l.source) || l.source,
            target: nodeById.get(l.target) || l.target,
            frequency: l.frequency,
            avgDuration: l.avgDuration
        })).filter(l => typeof l.source !== 'string' && typeof l.target !== 'string');

        // Scales
        const freqScale = d3.scaleLinear()
            .domain([0, d3.max(nodes, n => n.frequency) || 1])
            .range([8, 25]);

        const linkWidthScale = d3.scaleLinear()
            .domain([0, d3.max(links, l => l.frequency) || 1])
            .range([1, 6]);

        const durationColorScale = d3.scaleSequential(d3.interpolateYlOrRd)
            .domain([0, d3.max(links, l => l.avgDuration) || 1]);

        // Create simulation
        this.simulation = d3.forceSimulation<D3Node>(d3Nodes)
            .force('link', d3.forceLink<D3Node, D3Link>(d3Links).id(d => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-400))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide<D3Node>().radius(d => freqScale(d.frequency) + 10));

        // Draw links
        const linkGroup = svg.append('g').attr('class', 'links');
        const link = linkGroup.selectAll('line')
            .data(d3Links)
            .join('line')
            .attr('stroke', d => durationColorScale(d.avgDuration))
            .attr('stroke-width', d => linkWidthScale(d.frequency))
            .attr('stroke-opacity', 0.7)
            .attr('marker-end', 'url(#arrowhead)');

        // Draw nodes
        const nodeGroup = svg.append('g').attr('class', 'nodes');
        const node = nodeGroup.selectAll<SVGGElement, D3Node>('g')
            .data(d3Nodes)
            .join('g')
            .attr('class', 'node')
            .style('cursor', 'pointer')
            .call(this.drag(this.simulation) as any);

        // Node circles
        node.append('circle')
            .attr('r', d => freqScale(d.frequency))
            .attr('fill', d => this.getNodeColor(d.activity))
            .attr('stroke', d => this.selectedActivity() === d.activity ? '#fff' : 'transparent')
            .attr('stroke-width', 3)
            .attr('opacity', d => this.getNodeOpacity(d.activity));

        // Node labels
        node.append('text')
            .text(d => d.activity)
            .attr('dy', d => freqScale(d.frequency) + 14)
            .attr('text-anchor', 'middle')
            .attr('fill', 'var(--text-primary)')
            .attr('font-size', '11px')
            .attr('opacity', d => this.getNodeOpacity(d.activity));

        // Click handler
        node.on('click', (event, d) => {
            event.stopPropagation();
            this.dataService.toggleActivity(d.activity);
        });

        // Click on background to deselect
        svg.on('click', () => {
            this.dataService.selectActivity(null);
        });

        // Update positions on tick
        this.simulation.on('tick', () => {
            link
                .attr('x1', d => (d.source as D3Node).x)
                .attr('y1', d => (d.source as D3Node).y)
                .attr('x2', d => (d.target as D3Node).x)
                .attr('y2', d => (d.target as D3Node).y);

            node.attr('transform', d => `translate(${d.x},${d.y})`);
        });
    }

    private getNodeColor(activity: string): string {
        const colors: Record<string, string> = {
            'Order Created': '#4CAF50',
            'Payment Received': '#2196F3',
            'Payment Issue': '#f44336',
            'Order Shipped': '#FF9800',
            'Order Delivered': '#9C27B0',
            'Order Cancelled': '#607D8B',
            'Return Requested': '#E91E63',
            'Return Processed': '#00BCD4'
        };
        return colors[activity] || '#888';
    }

    private getNodeOpacity(activity: string): number {
        const selected = this.selectedActivity();
        if (!selected) return 1;
        return selected === activity ? 1 : 0.3;
    }

    private drag(simulation: d3.Simulation<D3Node, D3Link>): d3.DragBehavior<SVGGElement, D3Node, D3Node | d3.SubjectPosition> {
        function dragstarted(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3.drag<SVGGElement, D3Node>()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
    }
}
