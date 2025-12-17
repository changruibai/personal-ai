import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class OptimizeResumeDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  instruction?: string;

  @IsOptional()
  @IsString()
  targetPosition?: string;

  @IsOptional()
  @IsString()
  style?: 'professional' | 'creative' | 'academic' | 'minimal';
}

export class ParseResumeDto {
  @IsNotEmpty()
  @IsString()
  content: string;
}
