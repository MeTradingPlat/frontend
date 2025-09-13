import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainNavbar } from './main-navbar';

describe('MainNavbar', () => {
  let component: MainNavbar;
  let fixture: ComponentFixture<MainNavbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainNavbar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainNavbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
