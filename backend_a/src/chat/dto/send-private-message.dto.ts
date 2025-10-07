import { IsInt, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendPrivateMessageDto {
  @ApiProperty({ description: 'ID of the recipient' })
  @IsInt()
  recipientId: number;

  @ApiProperty({ description: 'Message content' })
  @IsString()
  @MaxLength(1000)
  content: string;
}
