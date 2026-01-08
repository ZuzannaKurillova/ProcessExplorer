import { Component, ElementRef, input, effect, viewChild } from '@angular/core';
import * as d3 from 'd3';
import { DailyKPI } from '../../models/event-log.model';

@Component({
  selector: 'app-kpi-timeline',
  standalone: true,
  templateUrl: './kpi-timeline.component.html',
  styleUrl: './kpi-timeline.component.scss'
})
export class KpiTimelineComponent {
  kpis = input.required<DailyKPI[]>();

  private readonly chartRef = viewChild.required<ElementRef<SVGSVGElement>>('chart');
  private readonly tooltipRef = viewChild.required<ElementRef<HTMLDivElement>>('tooltip');

  constructor() {
    effect(() => {
      const kpis = this.kpis();
      const svg = this.chartRef().nativeElement;
      if (kpis.length > 0 && svg) {
        this.renderChart(kpis);
      }
    });
  }

  private renderChart(kpis: DailyKPI[]): void {
    const svg = d3.select(this.chartRef().nativeElement);
    svg.selectAll('*').remove();

    const tooltip = d3.select(this.tooltipRef().nativeElement);

    const container = this.chartRef().nativeElement.parentElement;
    const width = container?.clientWidth || 400;
    const height = 220;

    const margin = { top: 20, right: 50, bottom: 30, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleTime()
      .domain(d3.extent(kpis, d => d.date) as [Date, Date])
      .range([0, innerWidth]);

    const yScaleDuration = d3.scaleLinear()
      .domain([0, d3.max(kpis, d => d.avgCaseDuration) || 1])
      .range([innerHeight, 0])
      .nice();

    const yScaleCount = d3.scaleLinear()
      .domain([0, d3.max(kpis, d => d.caseCount) || 1])
      .range([innerHeight, 0])
      .nice();

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScaleDuration)
        .tickSize(-innerWidth)
        .tickFormat(() => ''))
      .call(g => g.selectAll('line').attr('stroke', 'var(--border-color)').attr('stroke-opacity', 0.3))
      .call(g => g.select('.domain').remove());

    // Line generators
    const durationLine = d3.line<DailyKPI>()
      .x(d => xScale(d.date))
      .y(d => yScaleDuration(d.avgCaseDuration))
      .curve(d3.curveMonotoneX);

    const countLine = d3.line<DailyKPI>()
      .x(d => xScale(d.date))
      .y(d => yScaleCount(d.caseCount))
      .curve(d3.curveMonotoneX);

    // Draw duration line
    g.append('path')
      .datum(kpis)
      .attr('fill', 'none')
      .attr('stroke', '#2196F3')
      .attr('stroke-width', 2.5)
      .attr('d', durationLine);

    // Draw count line
    g.append('path')
      .datum(kpis)
      .attr('fill', 'none')
      .attr('stroke', '#4CAF50')
      .attr('stroke-width', 2.5)
      .attr('d', countLine);

    // Duration dots
    g.selectAll('.dot-duration')
      .data(kpis)
      .join('circle')
      .attr('class', 'dot-duration')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScaleDuration(d.avgCaseDuration))
      .attr('r', 5)
      .attr('fill', '#2196F3')
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => this.showTooltip(event, d, tooltip))
      .on('mouseout', () => this.hideTooltip(tooltip));

    // Count dots
    g.selectAll('.dot-count')
      .data(kpis)
      .join('circle')
      .attr('class', 'dot-count')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScaleCount(d.caseCount))
      .attr('r', 5)
      .attr('fill', '#4CAF50')
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => this.showTooltip(event, d, tooltip))
      .on('mouseout', () => this.hideTooltip(tooltip));

    // X axis
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .ticks(d3.timeDay.every(1))
        .tickFormat(d => d3.timeFormat('%b %d')(d as Date)))
      .call(g => g.select('.domain').attr('stroke', 'var(--border-color)'))
      .selectAll('text')
      .attr('fill', 'var(--text-secondary)')
      .attr('font-size', '10px');

    // Left Y axis (duration)
    g.append('g')
      .attr('class', 'y-axis-left')
      .call(d3.axisLeft(yScaleDuration).ticks(5).tickFormat(d => `${d}h`))
      .call(g => g.select('.domain').attr('stroke', 'var(--border-color)'))
      .selectAll('text')
      .attr('fill', '#2196F3')
      .attr('font-size', '10px');

    // Right Y axis (count)
    g.append('g')
      .attr('class', 'y-axis-right')
      .attr('transform', `translate(${innerWidth},0)`)
      .call(d3.axisRight(yScaleCount).ticks(5))
      .call(g => g.select('.domain').attr('stroke', 'var(--border-color)'))
      .selectAll('text')
      .attr('fill', '#4CAF50')
      .attr('font-size', '10px');
  }

  private showTooltip(event: MouseEvent, d: DailyKPI, tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>): void {
    const dateStr = d3.timeFormat('%b %d, %Y')(d.date);
    tooltip
      .style('opacity', 1)
      .style('left', `${event.offsetX + 10}px`)
      .style('top', `${event.offsetY - 10}px`)
      .html(`
        <strong>${dateStr}</strong><br/>
        Avg Duration: ${d.avgCaseDuration.toFixed(1)} hrs<br/>
        Cases: ${d.caseCount}
      `);
  }

  private hideTooltip(tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>): void {
    tooltip.style('opacity', 0);
  }
}
