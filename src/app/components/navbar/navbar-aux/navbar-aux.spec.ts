import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarAux } from './navbar-aux';

describe('NavbarAux', () => {
  let component: NavbarAux;
  let fixture: ComponentFixture<NavbarAux>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarAux]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarAux);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
