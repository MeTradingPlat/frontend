import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadPageError } from './load-page-error';

describe('LoadPageError', () => {
  let component: LoadPageError;
  let fixture: ComponentFixture<LoadPageError>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadPageError]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoadPageError);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
