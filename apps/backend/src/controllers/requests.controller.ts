import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as RequestsService from '../services/requests.service';

export const createRequest = asyncHandler(async (req: Request, res: Response) => {
  const request = await RequestsService.createRequest(req.user!.sub, req.body);
  res.status(201).json(request);
});

export const getIncoming = asyncHandler(async (req: Request, res: Response) => {
  const requests = await RequestsService.getIncomingRequests(req.user!.sub);
  res.json(requests);
});

export const getOutgoing = asyncHandler(async (req: Request, res: Response) => {
  const requests = await RequestsService.getOutgoingRequests(req.user!.sub);
  res.json(requests);
});

export const getRequest = asyncHandler(async (req: Request, res: Response) => {
  const request = await RequestsService.getRequest(req.params.id, req.user!.sub);
  res.json(request);
});

export const approveRequest = asyncHandler(async (req: Request, res: Response) => {
  const request = await RequestsService.approveRequest(req.params.id, req.user!.sub);
  res.json(request);
});

export const rejectRequest = asyncHandler(async (req: Request, res: Response) => {
  const request = await RequestsService.rejectRequest(req.params.id, req.user!.sub);
  res.json(request);
});

export const cancelRequest = asyncHandler(async (req: Request, res: Response) => {
  const request = await RequestsService.cancelRequest(req.params.id, req.user!.sub);
  res.json(request);
});
