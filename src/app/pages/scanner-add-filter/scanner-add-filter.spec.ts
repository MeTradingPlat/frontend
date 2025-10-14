import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScannerAddFilter } from './scanner-add-filter';

describe('ScannerAddFilter', () => {
  let component: ScannerAddFilter;
  let fixture: ComponentFixture<ScannerAddFilter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScannerAddFilter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScannerAddFilter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
