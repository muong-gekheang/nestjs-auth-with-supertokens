import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true }) // this creates createdAt & updatedAt automatically
export class User {

  @Prop({ required: true, unique: true })
  superTokensUserId: string;

  @Prop({ type: [String], default: [] })
  emails: string[];

  @Prop({ type: [String], default: [] })
  phoneNumbers: string[];

  @Prop()
  phonePassword: string;
}

export const UserSchema = SchemaFactory.createForClass(User);