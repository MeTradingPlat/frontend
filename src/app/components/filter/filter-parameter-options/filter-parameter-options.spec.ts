import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterParameterOptions } from './filter-parameter-options';

describe('FilterParameterOptions', () => {
  let component: FilterParameterOptions;
  let fixture: ComponentFixture<FilterParameterOptions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterParameterOptions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilterParameterOptions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
