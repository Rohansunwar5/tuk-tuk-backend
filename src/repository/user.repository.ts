import userModel, { IUser } from '../models/user.model';

export interface IOnBoardUserParams {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
}

export class UserRepository {
  private _model = userModel;

  async getUserByEmailId(email: string): Promise<IUser | null> {
    return this._model.findOne({ email });
  }

  async onBoardUser(params: IOnBoardUserParams): Promise<IUser> {
    const {
      firstName, lastName, email,
      password,
    } = params;

    return this._model.create({ firstName, lastName, email, password });
  }

  async getUserById(id: string) {
    return this._model.findById(id).select('img _id twoFactorEnabled twoFactorSecret firstName lastName email credits isdCode phoneNumber verified createdAt updatedAt __v');
  }

  async updateUser(params: {
    firstName?: string, lastName?: string, isdCode?: string, phoneNumber?: string, _id: string, bio?: string, location?: string, twoFactorSecret?: string, twoFactorEnabled?:boolean, company?: { name?: string, url?: string }, socials?: {
      twitter?: string,
      github?: string,
      facebook?: string,
      instagram?: string,
      linkedin?: string,
    }
  }) {
    const { firstName, lastName, isdCode, phoneNumber, _id, twoFactorEnabled, twoFactorSecret, bio, location, company, socials } = params;

    return this._model.findByIdAndUpdate(_id, { firstName, lastName, isdCode, phoneNumber, bio, location, company, socials, twoFactorEnabled, twoFactorSecret }, { new: true });
  }
  
  async verifyUserId(userId: string) {
    return this._model.findByIdAndUpdate(userId, {
      verified: true
    }, { new: true });
  }

}