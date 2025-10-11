import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterParameterNumber } from './filter-parameter-number';

describe('FilterParameterNumber', () => {
  let component: FilterParameterNumber;
  let fixture: ComponentFixture<FilterParameterNumber>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterParameterNumber]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilterParameterNumber);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
