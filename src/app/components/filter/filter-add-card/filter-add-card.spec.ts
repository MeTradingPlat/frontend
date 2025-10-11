import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterAddCard } from './filter-add-card';

describe('FilterAddCard', () => {
  let component: FilterAddCard;
  let fixture: ComponentFixture<FilterAddCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterAddCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilterAddCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
