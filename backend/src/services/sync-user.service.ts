import UserRoles  from 'supertokens-node/recipe/userroles';
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "src/super-tokens/schemas/user.schema";

export class SyncUserService{
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}
  
  async syncUser(userId: string, email?: string, phone?: string) {
    let user = await this.userModel.findOne({ superTokensUserId: userId });
    let role = "User";


    if (!user) {
      await this.userModel.create({
        superTokensUserId: userId,
        emails: email ? [email] : [],
        phoneNumbers: phone ? [phone] : [],
      });

      const result = await UserRoles.addRoleToUser("public", userId, role);
      console.log("Role assignment result:", result);
      return;
    }
    if (email && !user.emails.includes(email)) user.emails.push(email);
    if (phone && !user.phoneNumbers.includes(phone)) user.phoneNumbers.push(phone);
    
    await user.save();
    
  }
}