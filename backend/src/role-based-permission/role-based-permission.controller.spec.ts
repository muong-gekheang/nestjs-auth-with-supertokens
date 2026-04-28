import { Test, TestingModule } from '@nestjs/testing';
import { RoleBasedPermissionController } from './role-based-permission.controller';
import { RoleBasedPermissionService } from './role-based-permission.service';

describe('RoleBasedPermissionController', () => {
  let controller: RoleBasedPermissionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleBasedPermissionController],
      providers: [RoleBasedPermissionService],
    }).compile();

    controller = module.get<RoleBasedPermissionController>(RoleBasedPermissionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
