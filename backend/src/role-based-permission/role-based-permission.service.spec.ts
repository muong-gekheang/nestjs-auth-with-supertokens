import { Test, TestingModule } from '@nestjs/testing';
import { RoleBasedPermissionService } from './role-based-permission.service';

describe('RoleBasedPermissionService', () => {
  let service: RoleBasedPermissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoleBasedPermissionService],
    }).compile();

    service = module.get<RoleBasedPermissionService>(RoleBasedPermissionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
