import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class UpdateDisplayNameDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 30)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Display name can only contain letters, numbers, underscore and dash',
  })
  displayName: string;
}
