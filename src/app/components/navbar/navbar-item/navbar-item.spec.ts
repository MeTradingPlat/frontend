import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarItem } from './navbar-item';

describe('NavbarItem', () => {
  let component: NavbarItem;
  let fixture: ComponentFixture<NavbarItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarItem]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarItem);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
