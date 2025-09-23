import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { ScannerConfiguration } from './scanner-configuration';
import { EscanerService } from '../../services/escaner.service';
import { EstadoEscanerService } from '../../services/estado-escaner.service';
import { EnumConfigurationCard } from '../../enums/enum-configuration-card'; // Added import

describe('ScannerConfiguration', () => {
  let component: ScannerConfiguration;
  let fixture: ComponentFixture<ScannerConfiguration>;
  let mockActivatedRoute: any;
  let mockRouter: any;
  let mockEscanerService: any;
  let mockEstadoEscanerService: any;

  beforeEach(async () => {
    mockActivatedRoute = {
      paramMap: of({ get: (key: string) => (key === 'id' ? '1' : null) }),
      snapshot: { paramMap: { get: (key: string) => (key === 'id' ? '1' : null) } }
    };
    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };
    mockEscanerService = {
      getEscanerById: jasmine.createSpy('getEscanerById').and.returnValue(of({
        nombre: 'Test Scanner',
        descripcion: 'Description',
        horaInicio: '09:00',
        horaFin: '17:00',
        objTipoEjecucion: { enumTipoEjecucion: 'UNA_VEZ' },
        mercados: [{ enumMercado: 'NYSE' }]
      })),
      createEscaner: jasmine.createSpy('createEscaner').and.returnValue(of({})),
      updateEscaner: jasmine.createSpy('updateEscaner').and.returnValue(of({})),
      deleteEscaner: jasmine.createSpy('deleteEscaner').and.returnValue(of(true))
    };
    mockEstadoEscanerService = {
      archivarEscaner: jasmine.createSpy('archivarEscaner').and.returnValue(of({})),
      desarchivarEscaner: jasmine.createSpy('desarchivarEscaner').and.returnValue(of({}))
    };

    await TestBed.configureTestingModule({
      imports: [ScannerConfiguration],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: EscanerService, useValue: mockEscanerService },
        { provide: EstadoEscanerService, useValue: mockEstadoEscanerService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScannerConfiguration);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load scanner data on init if id is present', () => {
    expect(mockEscanerService.getEscanerById).toHaveBeenCalledWith(1);
    expect(component.currentScannerData()?.nombre).toBe('Test Scanner');
    expect(component.loading()).toBeFalse();
  });

  it('should set default scanner data on init if no id is present', () => {
    mockActivatedRoute.paramMap = of({ get: (key: string) => null });
    mockActivatedRoute.snapshot.paramMap = { get: (key: string) => null };
    fixture = TestBed.createComponent(ScannerConfiguration);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(mockEscanerService.getEscanerById).not.toHaveBeenCalled();
    expect(component.currentScannerData()?.nombre).toBe('');
    expect(component.loading()).toBeFalse();
  });

  it('should update card data', () => {
    component.updateCardData(EnumConfigurationCard.GENERAL, { nombre: 'Updated Name' });
    expect(component.currentScannerData()?.nombre).toBe('Updated Name');
    expect(component.formTouched()).toBeTrue();
  });

  it('should update form validity', () => {
    component.onFormValidityChange(EnumConfigurationCard.GENERAL, true);
    expect(component.generalFormValid()).toBeTrue();
  });

  it('should save a new scanner', () => {
    component.scannerId.set(0); // Simulate new scanner
    component.generalFormValid.set(true);
    component.timeFormValid.set(true);
    component.marketFormValid.set(true);
    component.currentScannerData.set(component['getDefaultScannerData']()); // Set default data
    component.saveScannerConfiguration('/escaner');
    expect(component.submitted()).toBeTrue();
    expect(component.loading()).toBeFalse(); // finalize sets it to false
    expect(mockEscanerService.createEscaner).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/escaner']);
  });

  it('should update an existing scanner', () => {
    component.scannerId.set(1); // Simulate existing scanner
    component.generalFormValid.set(true);
    component.timeFormValid.set(true);
    component.marketFormValid.set(true);
    component.currentScannerData.set(component['getDefaultScannerData']()); // Set default data
    component.saveScannerConfiguration('/escaner');
    expect(component.submitted()).toBeTrue();
    expect(component.loading()).toBeFalse(); // finalize sets it to false
    expect(mockEscanerService.updateEscaner).toHaveBeenCalledWith(1, jasmine.any(Object));
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/escaner']);
  });

  it('should archive a scanner', () => {
    component.scannerId.set(1);
    component.generalFormValid.set(true);
    component.timeFormValid.set(true);
    component.marketFormValid.set(true);
    component.currentScannerData.set(component['getDefaultScannerData']()); // Set default data
    component.archiveScanner('/escaner');
    expect(component.loading()).toBeFalse();
    expect(mockEstadoEscanerService.archivarEscaner).toHaveBeenCalledWith(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/escaner']);
  });

  it('should unarchive a scanner', () => {
    component.scannerId.set(1);
    component.generalFormValid.set(true);
    component.timeFormValid.set(true);
    component.marketFormValid.set(true);
    component.currentScannerData.set(component['getDefaultScannerData']()); // Set default data
    component.unarchiveScanner('/escaner');
    expect(component.loading()).toBeFalse();
    expect(mockEstadoEscanerService.desarchivarEscaner).toHaveBeenCalledWith(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/escaner']);
  });

  it('should delete a scanner', () => {
    component.scannerId.set(1);
    component.deleteScanner('/escaner');
    expect(component.loading()).toBeFalse();
    expect(mockEscanerService.deleteEscaner).toHaveBeenCalledWith(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/escaner']);
  });
});
