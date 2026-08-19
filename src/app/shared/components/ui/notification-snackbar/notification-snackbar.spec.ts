import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

import { NotificationSnackbar } from './notification-snackbar';

describe('NotificationSnackbar', () => {
  let component: NotificationSnackbar;
  let fixture: ComponentFixture<NotificationSnackbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationSnackbar],
      providers: [
        { provide: MAT_SNACK_BAR_DATA, useValue: { message: 'Test', type: 'info' } },
        { provide: MatSnackBarRef, useValue: { dismiss: () => {} } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationSnackbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
