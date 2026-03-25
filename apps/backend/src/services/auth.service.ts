import crypto from 'crypto';
import { UserModel, IUser } from '../models/User.model';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function buildTokenPayload(user: IUser) {
  return {
    sub: user._id.toString(),
    email: user.email,
    role: user.role ?? 'rider',
    isOnboarded: user.isOnboarded,
  };
}

export async function issueTokens(user: IUser): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const refreshToken = signRefreshToken(user._id.toString());
  await UserModel.findByIdAndUpdate(user._id, {
    refreshTokenHash: hashToken(refreshToken),
  });
  return {
    accessToken: signAccessToken(buildTokenPayload(user)),
    refreshToken,
  };
}

export async function refreshTokens(
  incomingRefreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const payload = verifyRefreshToken(incomingRefreshToken);

  const user = await UserModel.findById(payload.sub).select('+refreshTokenHash');
  if (!user || user.refreshTokenHash !== hashToken(incomingRefreshToken)) {
    throw new Error('Invalid refresh token');
  }

  return issueTokens(user);
}

export async function logout(userId: string): Promise<void> {
  await UserModel.findByIdAndUpdate(userId, { refreshTokenHash: null });
}
