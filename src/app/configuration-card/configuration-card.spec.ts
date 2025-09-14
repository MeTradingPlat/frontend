import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigurationCard } from './configuration-card';

describe('ConfigurationCard', () => {
  let component: ConfigurationCard;
  let fixture: ComponentFixture<ConfigurationCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigurationCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfigurationCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
