import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScannerInfo } from './scanner-info';

describe('ScannerInfo', () => {
  let component: ScannerInfo;
  let fixture: ComponentFixture<ScannerInfo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScannerInfo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScannerInfo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
