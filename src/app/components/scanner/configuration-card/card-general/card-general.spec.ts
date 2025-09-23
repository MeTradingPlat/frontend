import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardGeneral } from './card-general';

describe('CardGeneral', () => {
  let component: CardGeneral;
  let fixture: ComponentFixture<CardGeneral>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardGeneral]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardGeneral);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
