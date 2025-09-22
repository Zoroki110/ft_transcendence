import { FriendshipStatus } from '../../entities/friendship.entity';

export class SimplifiedUser {
  id: number;
  username: string;
  displayName?: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export class FriendshipResponseDto {
  id: number;
  status: FriendshipStatus;
  requester: SimplifiedUser;
  addressee: SimplifiedUser;
  createdAt: Date;
  updatedAt: Date;
}