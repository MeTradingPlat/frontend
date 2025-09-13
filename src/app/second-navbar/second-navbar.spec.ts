import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecondNavbar } from './second-navbar';

describe('SecondNavbar', () => {
  let component: SecondNavbar;
  let fixture: ComponentFixture<SecondNavbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecondNavbar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecondNavbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
