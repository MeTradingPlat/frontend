import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardMarket } from './card-market';

describe('CardMarket', () => {
  let component: CardMarket;
  let fixture: ComponentFixture<CardMarket>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardMarket]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardMarket);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
