import { UserModel, IUser } from '../models/User.model';
import { signAccessToken } from '../utils/jwt';

export async function getMe(userId: string): Promise<IUser> {
  const user = await UserModel.findById(userId);
  if (!user) throw new Error('User not found');
  return user;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<IUser, 'name' | 'phone' | 'gender' | 'role'>>
): Promise<{ user: IUser; accessToken?: string }> {
  const user = await UserModel.findByIdAndUpdate(userId, updates, { new: true });
  if (!user) throw new Error('User not found');
  return { user };
}

export async function completeOnboarding(
  userId: string,
  data: { phone: string; gender: IUser['gender']; role: IUser['role'] }
): Promise<{ user: IUser; accessToken: string }> {
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { ...data, isOnboarded: true },
    { new: true }
  );
  if (!user) throw new Error('User not found');

  const accessToken = signAccessToken({
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
    isOnboarded: true,
  });

  return { user, accessToken };
}

export async function updateDriverProfile(
  userId: string,
  driverProfile: NonNullable<IUser['driverProfile']>
): Promise<IUser> {
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { driverProfile },
    { new: true }
  );
  if (!user) throw new Error('User not found');
  return user;
}

export async function getPublicUser(userId: string): Promise<IUser> {
  const user = await UserModel.findById(userId).select(
    'name photo gender role driverProfile.availableSeats driverProfile.genderPreference driverProfile.officeLocation'
  );
  if (!user) throw new Error('User not found');
  return user;
}
