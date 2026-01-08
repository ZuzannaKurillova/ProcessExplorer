import { Component, ElementRef, input, effect, inject, viewChild } from '@angular/core';
import * as d3 from 'd3';
import { ActivityStats } from '../../models/event-log.model';
import { ProcessDataService } from '../../services/process-data.service';

@Component({
    selector: 'app-bottleneck-chart',
    standalone: true,
    template: `
    <div class="chart-container">
      <h3>Bottleneck Analysis</h3>
      <p class="chart-subtitle">Average duration per activity (minutes)</p>
      <svg #chart></svg>
    </div>
  `,
    styles: [`
    .chart-container {
      background: var(--card-bg);
      border-radius: 12px;
      padding: 20px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    h3 {
      margin: 0 0 4px 0;
      color: var(--text-primary);
      font-size: 1.1rem;
      font-weight: 600;
    }
    .chart-subtitle {
      margin: 0 0 16px 0;
      color: var(--text-secondary);
      font-size: 0.85rem;
    }
    svg {
      flex: 1;
      min-height: 250px;
    }
  `]
})
export class BottleneckChartComponent {
    stats = input.required<ActivityStats[]>();

    private readonly dataService = inject(ProcessDataService);
    private readonly chartRef = viewChild.required<ElementRef<SVGSVGElement>>('chart');

    constructor() {
        effect(() => {
            const stats = this.stats();
            const svg = this.chartRef().nativeElement;
            this.selectedActivity(); // Track selection changes
            if (stats.length > 0 && svg) {
                this.renderChart(stats);
            }
        });
    }

    private selectedActivity = () => this.dataService.selectedActivity();

    private renderChart(stats: ActivityStats[]): void {
        const svg = d3.select(this.chartRef().nativeElement);
        svg.selectAll('*').remove();

        const container = this.chartRef().nativeElement.parentElement;
        const width = container?.clientWidth || 400;
        const height = Math.max(250, stats.length * 40 + 40);

        const margin = { top: 10, right: 30, bottom: 30, left: 120 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        svg.attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Scales
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(stats, d => d.avgDuration) || 1])
            .range([0, innerWidth]);

        const yScale = d3.scaleBand()
            .domain(stats.map(d => d.activity))
            .range([0, innerHeight])
            .padding(0.2);

        // Color scale based on duration severity
        const maxDuration = d3.max(stats, d => d.avgDuration) || 1;
        const colorScale = (duration: number) => {
            const ratio = duration / maxDuration;
            if (ratio > 0.7) return '#f44336';
            if (ratio > 0.4) return '#FF9800';
            return '#4CAF50';
        };

        // Draw bars
        const bars = g.selectAll('rect')
            .data(stats)
            .join('rect')
            .attr('y', d => yScale(d.activity) || 0)
            .attr('height', yScale.bandwidth())
            .attr('fill', d => colorScale(d.avgDuration))
            .attr('rx', 4)
            .attr('opacity', d => this.getBarOpacity(d.activity))
            .style('cursor', 'pointer')
            .attr('x', 0)
            .attr('width', 0);

        // Animate bars
        bars.transition()
            .duration(600)
            .attr('width', d => xScale(d.avgDuration));

        // Duration labels on bars
        g.selectAll('.value-label')
            .data(stats)
            .join('text')
            .attr('class', 'value-label')
            .attr('x', d => xScale(d.avgDuration) + 5)
            .attr('y', d => (yScale(d.activity) || 0) + yScale.bandwidth() / 2)
            .attr('dy', '0.35em')
            .attr('fill', 'var(--text-secondary)')
            .attr('font-size', '11px')
            .attr('opacity', d => this.getBarOpacity(d.activity))
            .text(d => d.avgDuration > 0 ? `${Math.round(d.avgDuration)}m` : '');

        // Y axis (activity names)
        g.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(yScale).tickSize(0))
            .call(g => g.select('.domain').remove())
            .selectAll('text')
            .attr('fill', 'var(--text-primary)')
            .attr('font-size', '11px')
            .style('cursor', 'pointer')
            .attr('opacity', (d) => this.getBarOpacity(d as string))
            .on('click', (event, d) => {
                event.stopPropagation();
                this.dataService.toggleActivity(d as string);
            });

        // Click on bars
        bars.on('click', (event, d) => {
            event.stopPropagation();
            this.dataService.toggleActivity(d.activity);
        });

        // Click on background to deselect
        svg.on('click', () => {
            this.dataService.selectActivity(null);
        });

        // X axis
        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => `${d}m`))
            .call(g => g.select('.domain').attr('stroke', 'var(--border-color)'))
            .selectAll('text')
            .attr('fill', 'var(--text-secondary)')
            .attr('font-size', '10px');

        g.selectAll('.x-axis line').attr('stroke', 'var(--border-color)');
    }

    private getBarOpacity(activity: string): number {
        const selected = this.selectedActivity();
        if (!selected) return 1;
        return selected === activity ? 1 : 0.3;
    }
}
