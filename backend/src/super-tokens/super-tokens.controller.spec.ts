import { Test, TestingModule } from '@nestjs/testing';
import { SuperTokensController } from './super-tokens.controller';
import { SuperTokensService } from './super-tokens.service';

describe('SuperTokensController', () => {
  let controller: SuperTokensController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuperTokensController],
      providers: [SuperTokensService],
    }).compile();

    controller = module.get<SuperTokensController>(SuperTokensController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
