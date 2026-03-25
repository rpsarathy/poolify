import { Request, Response } from 'express';
import { issueTokens, refreshTokens, logout } from '../services/auth.service';
import { IUser } from '../models/User.model';
import { asyncHandler } from '../utils/asyncHandler';

const getClientUrl = () => process.env.CLIENT_URL || 'http://localhost:8081';

export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  const clientUrl = getClientUrl();

  if (!req.user) {
    res.redirect(`${clientUrl}?error=google_auth_failed`);
    return;
  }

  try {
    const user = req.user as unknown as IUser;
    const { accessToken, refreshToken } = await issueTokens(user);
    res.redirect(`${clientUrl}?accessToken=${accessToken}&refreshToken=${refreshToken}`);
  } catch (err) {
    console.error('[AUTH] Token issuance failed:', err);
    res.redirect(`${clientUrl}?error=token_failed`);
  }
});

export const googleCallbackError = (req: Request, res: Response) => {
  const clientUrl = getClientUrl();
  res.redirect(`${clientUrl}?error=google_denied`);
};

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken: string };
  if (!refreshToken) {
    res.status(400).json({ error: 'refreshToken is required' });
    return;
  }
  try {
    const tokens = await refreshTokens(refreshToken);
    res.json(tokens);
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

export const logoutHandler = asyncHandler(async (req: Request, res: Response) => {
  await logout(req.user!.sub);
  res.status(204).send();
});
