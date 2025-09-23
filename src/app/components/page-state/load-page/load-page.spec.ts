import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadPage } from './load-page';

describe('LoadPage', () => {
  let component: LoadPage;
  let fixture: ComponentFixture<LoadPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoadPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
