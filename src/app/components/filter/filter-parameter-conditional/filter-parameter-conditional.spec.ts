import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterParameterConditional } from './filter-parameter-conditional';

describe('FilterParameterConditional', () => {
  let component: FilterParameterConditional;
  let fixture: ComponentFixture<FilterParameterConditional>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterParameterConditional]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilterParameterConditional);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
