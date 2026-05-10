import { z } from 'zod';
import type { User } from '../../domain/entities/user.js';
import {
  toUserAttributesData,
  userAttributesDataSchema,
} from './user.attributes.data.js';
import {
  toUserRelationshipsData,
  userRelationshipsDataSchema,
} from './user.relationships.data.js';

export const userDataSchema = z.object({
  type: z.literal('users'),
  id: z.string().uuid(),
  attributes: userAttributesDataSchema,
  relationships: userRelationshipsDataSchema,
});

export type UserData = z.infer<typeof userDataSchema>;

export const toUserData = (u: User): UserData => ({
  type: 'users',
  id: u.id,
  attributes: toUserAttributesData(u),
  relationships: toUserRelationshipsData(u),
});

export const UserData = {
  schema: userDataSchema,
  fromModel: toUserData,
  collect: (xs: readonly User[]): UserData[] => xs.map(toUserData),
} as const;
