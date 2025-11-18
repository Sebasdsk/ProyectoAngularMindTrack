import { TestBed } from '@angular/core/testing';

import { Focus } from './focus';

describe('Focus', () => {
  let service: Focus;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Focus);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
