import { PartialType } from '@nestjs/swagger';
import { CreateRoleBasedPermissionDto } from './create-role-based-permission.dto';

export class UpdateRoleBasedPermissionDto extends PartialType(CreateRoleBasedPermissionDto) {}
