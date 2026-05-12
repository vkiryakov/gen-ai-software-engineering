import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  AccountBalance,
  AccountInterest,
  AccountSummary,
} from './accounts.service';
import { AccountsService } from './accounts.service';
import { CalculateInterestDto } from './dto/calculate-interest.dto';

@ApiTags('accounts')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get(':accountId/balance')
  @ApiOperation({
    summary:
      'Get the balance for an account, grouped by currency, from completed transactions.',
  })
  getBalance(@Param('accountId') accountId: string): AccountBalance {
    return this.accounts.getBalance(accountId);
  }

  @Get(':accountId/summary')
  @ApiOperation({
    summary:
      'Get an activity summary for an account: per-currency deposit/withdrawal totals, transaction count, and most recent transaction date.',
  })
  getSummary(@Param('accountId') accountId: string): AccountSummary {
    return this.accounts.getSummary(accountId);
  }

  @Get(':accountId/interest')
  @ApiOperation({
    summary:
      'Calculate simple interest on the account’s current per-currency balance, given an annual rate and a number of days.',
  })
  calculateInterest(
    @Param('accountId') accountId: string,
    @Query() query: CalculateInterestDto,
  ): AccountInterest {
    return this.accounts.calculateInterest(accountId, query);
  }
}
