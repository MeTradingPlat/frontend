import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScannerArchived } from './scanner-archived';

describe('ScannerArchived', () => {
  let component: ScannerArchived;
  let fixture: ComponentFixture<ScannerArchived>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScannerArchived]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScannerArchived);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
