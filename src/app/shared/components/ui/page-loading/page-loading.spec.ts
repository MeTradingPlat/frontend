import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageLoading } from './page-loading';

describe('PageLoading', () => {
  let component: PageLoading;
  let fixture: ComponentFixture<PageLoading>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageLoading]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PageLoading);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
