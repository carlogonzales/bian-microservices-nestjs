import { IsIn, IsNotEmpty, IsString } from 'class-validator';

const SUPPORTED_CURRENCIES = ['PHP', 'USD', 'EUR'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @IsString()
  @IsIn(SUPPORTED_CURRENCIES as unknown as string[])
  currency!: SupportedCurrency;
}
