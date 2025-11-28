import * as repo from '../repositories/reviewRepository.js';
import type {
  CreateReviewDtoType,
  UpdateReviewDtoType,
} from '../dtos/review.dto.js';

export const createReview = async (
  data: CreateReviewDtoType & { userId: string },
) => {
  return repo.createReview(data);
};

export const getReviewById = async (id: string) => repo.findReviewById(id);

export const listReviews = async (opts: {
  page: number;
  limit: number;
  productId?: string;
  userId?: string;
}) => repo.findReviews(opts);

export const updateReview = async (id: string, data: UpdateReviewDtoType) =>
  repo.updateReview(id, data);

export const deleteReview = async (id: string) => repo.deleteReview(id);
