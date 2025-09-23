import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardTime } from './card-time';

describe('CardTime', () => {
  let component: CardTime;
  let fixture: ComponentFixture<CardTime>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardTime]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardTime);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
