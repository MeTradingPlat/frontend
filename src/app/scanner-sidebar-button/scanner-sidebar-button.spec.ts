import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScannerSidebarButton } from './scanner-sidebar-button';

describe('ScannerSidebarButton', () => {
  let component: ScannerSidebarButton;
  let fixture: ComponentFixture<ScannerSidebarButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScannerSidebarButton]
    }).compileComponents();

    fixture = TestBed.createComponent(ScannerSidebarButton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit buttonClicked event on click', () => {
    spyOn(component.buttonClicked, 'emit');
    const buttonElement = fixture.nativeElement.querySelector('.scanner-sidebar-button');
    buttonElement.click();
    expect(component.buttonClicked.emit).toHaveBeenCalledWith(component.buttonText);
  });

  it('should apply selected class when isSelected is true', () => {
    component.isSelected = true;
    fixture.detectChanges();
    const buttonElement = fixture.nativeElement.querySelector('.scanner-sidebar-button');
    expect(buttonElement.classList).toContain('selected');
  });

  it('should not apply selected class when isSelected is false', () => {
    component.isSelected = false;
    fixture.detectChanges();
    const buttonElement = fixture.nativeElement.querySelector('.scanner-sidebar-button');
    expect(buttonElement.classList).not.toContain('selected');
  });
});
