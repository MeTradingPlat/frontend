import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScannerInfoItem } from './scanner-info-item';

describe('ScannerInfoItem', () => {
  let component: ScannerInfoItem;
  let fixture: ComponentFixture<ScannerInfoItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScannerInfoItem]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScannerInfoItem);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
