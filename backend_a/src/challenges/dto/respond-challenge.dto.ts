import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RespondChallengeDto {
  @ApiProperty({ description: 'Accept or decline the challenge' })
  @IsBoolean()
  accept: boolean;
}
