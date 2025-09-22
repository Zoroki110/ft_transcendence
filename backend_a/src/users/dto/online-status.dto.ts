import { IsBoolean, IsNotEmpty } from 'class-validator';

export class OnlineStatusDto {
  @IsNotEmpty()
  @IsBoolean()
  isOnline: boolean;
}