import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScannerExpand } from './scanner-expand';

describe('ScannerExpand', () => {
  let component: ScannerExpand;
  let fixture: ComponentFixture<ScannerExpand>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScannerExpand]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScannerExpand);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
