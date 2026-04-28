import { Test, TestingModule } from '@nestjs/testing';
import { SuperTokensService } from './super-tokens.service';

describe('SuperTokensService', () => {
  let service: SuperTokensService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SuperTokensService],
    }).compile();

    service = module.get<SuperTokensService>(SuperTokensService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
