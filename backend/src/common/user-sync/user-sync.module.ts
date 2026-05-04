import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "src/common/schemas/user.schema";
import { Module } from "@nestjs/common";
import { UserSyncService } from "./user-sync.service";
import { RoleServiceModule } from "../role/role.module";
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), // ← add this
    RoleServiceModule, 
  ],
  providers: [UserSyncService],
  exports: [UserSyncService],
})
export class UserSyncServiceModule{}
