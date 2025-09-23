import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScannerArchivedTable } from './scanner-archived-table';

describe('ScannerArchivedTable', () => {
  let component: ScannerArchivedTable;
  let fixture: ComponentFixture<ScannerArchivedTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScannerArchivedTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScannerArchivedTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
