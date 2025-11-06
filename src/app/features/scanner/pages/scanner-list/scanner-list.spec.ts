import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScannerList } from './scanner-list';

describe('ScannerList', () => {
  let component: ScannerList;
  let fixture: ComponentFixture<ScannerList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScannerList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScannerList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
