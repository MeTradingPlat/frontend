import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetUpScanner } from './set-up-scanner';

describe('SetUpScanner', () => {
  let component: SetUpScanner;
  let fixture: ComponentFixture<SetUpScanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetUpScanner]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetUpScanner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
