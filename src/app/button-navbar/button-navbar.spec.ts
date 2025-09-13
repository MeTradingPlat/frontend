import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ButtonNavbar } from './button-navbar';

describe('ButtonNavbar', () => {
  let component: ButtonNavbar;
  let fixture: ComponentFixture<ButtonNavbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonNavbar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ButtonNavbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
