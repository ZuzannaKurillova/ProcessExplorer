import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BottleneckChartComponent } from './bottleneck-chart.component';
import { ProcessDataService } from '../../services/process-data.service';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('BottleneckChartComponent', () => {
    let component: BottleneckChartComponent;
    let fixture: ComponentFixture<BottleneckChartComponent>;
    let mockProcessDataService: any;

    beforeEach(async () => {
        mockProcessDataService = {
            selectedActivity: signal(null),
            toggleActivity: vi.fn(),
            selectActivity: vi.fn()
        };

        await TestBed.configureTestingModule({
            imports: [BottleneckChartComponent],
            providers: [
                { provide: ProcessDataService, useValue: mockProcessDataService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(BottleneckChartComponent);
        component = fixture.componentInstance;

        fixture.componentRef.setInput('stats', []);

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have chart container', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('.chart-container')).toBeTruthy();
    });

    it('should have svg element', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('svg')).toBeTruthy();
    });
});
