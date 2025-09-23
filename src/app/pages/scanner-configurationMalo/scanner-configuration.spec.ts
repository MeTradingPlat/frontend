import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScannerConfiguration } from './scanner-configuration';

describe('ScannerConfiguration', () => {
  let component: ScannerConfiguration;
  let fixture: ComponentFixture<ScannerConfiguration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScannerConfiguration]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScannerConfiguration);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
