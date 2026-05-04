import { InjectModel, MongooseModule } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument} from "src/common/schemas/user.schema";
import { Injectable } from "@nestjs/common";

@Injectable()
export class UserSyncService{
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}
  
  async syncUser(userId: string, email?: string, phone?: string) {
    const user = await this.userModel.findOne({ superTokensUserId: userId });

    if (!user) {
      await this.createUser(userId, email, phone);
      return;
    }

    await this.updateUserContact(user, email, phone);
    
  };

  private async createUser(userId: string, email?: string, phoneNumber?: string): Promise<void>{
    await this.userModel.create({
      superTokensUserId: userId,
      emails: email ? [email] : [],
      phoneNumbers: phoneNumber ? [phoneNumber] : [],
    });
  }

  private async updateUserContact(user: UserDocument, email?: string, phone?: string): Promise<void> {
    if (email && !user.emails.includes(email)) user.emails.push(email);
    if (phone && !user.phoneNumbers.includes(phone)) user.phoneNumbers.push(phone);
    await user.save();
  }
}

