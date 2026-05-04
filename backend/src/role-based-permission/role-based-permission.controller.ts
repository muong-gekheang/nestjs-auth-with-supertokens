import { Controller, Get, Post, Body, Patch, Param, Delete, Req, ForbiddenException, UseGuards } from '@nestjs/common';
import { RoleBasedPermissionService } from './role-based-permission.service';
import { CreateRoleBasedPermissionDto } from './dto/create-role-based-permission.dto';
import { UpdateRoleBasedPermissionDto } from './dto/update-role-based-permission.dto';
import UserRoles from "supertokens-node/recipe/userroles";
import { SessionGuard } from 'src/auth/session.guard';
import { Roles, RolesGuard } from 'src/auth/role.guard';

@Controller('rbp')
@UseGuards(SessionGuard, RolesGuard) 
export class RoleBasedPermissionController {
  constructor(private readonly roleBasedPermissionService: RoleBasedPermissionService) {}

  @Post()
  create(@Body() createRoleBasedPermissionDto: CreateRoleBasedPermissionDto) {
    return this.roleBasedPermissionService.create(createRoleBasedPermissionDto);
  }

  @Get('read')
  @Roles('User', 'Admin')
  async read(@Req() req) {
    console.log(req.headers);
    // return "ok";
    return { message: "READ Success" };
  }

  @Post('write')
  @Roles('User', 'Admin')
  async write(@Req() req) {
    return { message: "WRITE success" };
  }

  @Delete('delete')
  @Roles('Admin')
  async delete (@Req() req){
    return { message: "DELETE success" };
  }
}
