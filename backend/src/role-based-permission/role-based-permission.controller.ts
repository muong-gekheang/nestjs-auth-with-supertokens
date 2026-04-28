import { Controller, Get, Post, Body, Patch, Param, Delete, Req, ForbiddenException, UseGuards } from '@nestjs/common';
import { RoleBasedPermissionService } from './role-based-permission.service';
import { CreateRoleBasedPermissionDto } from './dto/create-role-based-permission.dto';
import { UpdateRoleBasedPermissionDto } from './dto/update-role-based-permission.dto';
import UserRoles from "supertokens-node/recipe/userroles";
import { SessionGuard } from 'src/super-tokens/session.guard';
import { Roles, RolesGuard } from 'src/super-tokens/role.guard';

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
    // const userId = req.session.getUserId();
    // const roles = await UserRoles.getRolesForUser("public", userId);

    // if (!roles.roles.includes("User") && !roles.roles.includes("Admin")) {
    //   throw new ForbiddenException("No permission to read");
    // }
    return { message: "READ Success" };
  }

  @Post('write')
  @Roles('User', 'Admin')
  async write(@Req() req) {
    // const userId = req.session.getUserId();
  
    // console.log(req.session.userDataInAccessToken['st-role'])
    // const roles = await UserRoles.getRolesForUser("public", userId);
    // if (!roles.roles.includes("User") && !roles.roles.includes("Admin")) {
    //   throw new ForbiddenException("No permission to read");
    // }
    return { message: "WRITE success" };
  }

  @Delete('delete')
  @Roles('Admin')
  async delete (@Req() req){
    // const userId = req.session.getUserId();
    // const roles = await UserRoles.getRolesForUser("public", userId);
    // if (!roles.roles.includes("Admin")) {
    //   throw new ForbiddenException("Only admin can delete");
    // }
    return { message: "DELETE success" };
  }
}
