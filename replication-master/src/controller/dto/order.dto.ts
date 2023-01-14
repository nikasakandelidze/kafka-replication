import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class OrderDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  details: string;

  @IsNumber()
  price: number;

  @IsNumber()
  numberOfItems: number;

  @IsNotEmpty()
  @IsString()
  authorName: string;
}
