import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScannerInfoExpand } from './scanner-info-expand';

describe('ScannerInfoExpand', () => {
  let component: ScannerInfoExpand;
  let fixture: ComponentFixture<ScannerInfoExpand>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScannerInfoExpand]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScannerInfoExpand);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
