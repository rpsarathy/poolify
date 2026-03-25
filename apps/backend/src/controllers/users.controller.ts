import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as UsersService from '../services/users.service';

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await UsersService.getMe(req.user!.sub);
  res.json(user);
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const result = await UsersService.updateProfile(req.user!.sub, req.body);
  res.json(result);
});

export const completeOnboarding = asyncHandler(async (req: Request, res: Response) => {
  const result = await UsersService.completeOnboarding(req.user!.sub, req.body);
  res.json(result);
});

export const updateDriverProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await UsersService.updateDriverProfile(req.user!.sub, req.body);
  res.json(user);
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await UsersService.getPublicUser(req.params.id);
  res.json(user);
});
