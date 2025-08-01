import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @Length(3, 20)
  username: string;

  @IsEmail()
  email: string;

  @Length(6, 30)
  password: string;
}