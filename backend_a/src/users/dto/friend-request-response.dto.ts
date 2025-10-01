import { IsNotEmpty, IsBoolean } from 'class-validator';

export class FriendRequestResponseDto {
  @IsNotEmpty()
  @IsBoolean()
  accept: boolean; // true = accept, false = reject
}
