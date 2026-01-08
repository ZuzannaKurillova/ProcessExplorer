import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProcessGraphComponent } from './process-graph.component';
import { ProcessDataService } from '../../services/process-data.service';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ProcessGraphComponent', () => {
    let component: ProcessGraphComponent;
    let fixture: ComponentFixture<ProcessGraphComponent>;
    let mockProcessDataService: any;

    beforeEach(async () => {
        mockProcessDataService = {
            selectedActivity: signal(null),
            toggleActivity: vi.fn(),
            selectActivity: vi.fn()
        };

        await TestBed.configureTestingModule({
            imports: [ProcessGraphComponent],
            providers: [
                { provide: ProcessDataService, useValue: mockProcessDataService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ProcessGraphComponent);
        component = fixture.componentInstance;

        // Set required inputs
        fixture.componentRef.setInput('nodes', []);
        fixture.componentRef.setInput('links', []);

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
