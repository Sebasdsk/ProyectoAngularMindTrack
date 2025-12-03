import { TestBed } from '@angular/core/testing';

import { DateFilter } from './date-filter';

describe('DateFilter', () => {
  let service: DateFilter;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DateFilter);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
