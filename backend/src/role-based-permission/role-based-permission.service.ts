import { Injectable } from '@nestjs/common';
import { CreateRoleBasedPermissionDto } from './dto/create-role-based-permission.dto';
import { UpdateRoleBasedPermissionDto } from './dto/update-role-based-permission.dto';

@Injectable()
export class RoleBasedPermissionService {
  create(createRoleBasedPermissionDto: CreateRoleBasedPermissionDto) {
    return 'This action adds a new roleBasedPermission';
  }

  findAll() {
    return `This action returns all roleBasedPermission`;
  }

  findOne(id: number) {
    return `This action returns a #${id} roleBasedPermission`;
  }

  update(id: number, updateRoleBasedPermissionDto: UpdateRoleBasedPermissionDto) {
    return `This action updates a #${id} roleBasedPermission`;
  }

  remove(id: number) {
    return `This action removes a #${id} roleBasedPermission`;
  }
}
