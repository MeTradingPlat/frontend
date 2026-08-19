import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageMaintenance } from './page-maintenance';

describe('PageMaintenance', () => {
  let component: PageMaintenance;
  let fixture: ComponentFixture<PageMaintenance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageMaintenance]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PageMaintenance);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
