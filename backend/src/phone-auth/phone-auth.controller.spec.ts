import { Test, TestingModule } from '@nestjs/testing';
import { PhoneAuthController } from './phone-auth.controller';
import { PhoneAuthService } from './phone-auth.service';

describe('PhoneAuthController', () => {
  let controller: PhoneAuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PhoneAuthController],
      providers: [PhoneAuthService],
    }).compile();

    controller = module.get<PhoneAuthController>(PhoneAuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
