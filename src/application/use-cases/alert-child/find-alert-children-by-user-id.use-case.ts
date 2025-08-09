import { Inject, Injectable } from '@nestjs/common';
import { AlertChildResponseDto } from 'src/application/dtos/alert-child/alert-child-response.dto';
import { RequestUserContext } from 'src/common/context/user-context.service';
import { ALERT_CHILD_REPOSITORY } from 'src/domain/constants/tokens';
import type { AlertChildRepository } from 'src/domain/repositories/alert-child.repository';

@Injectable()
export class FindAlertChildrenByUserIdUseCase {
  constructor(
    @Inject(ALERT_CHILD_REPOSITORY)
    private readonly alertChildRepository: AlertChildRepository,
    private readonly userContext: RequestUserContext,
  ) {}

  async execute(): Promise<AlertChildResponseDto[]> {
    const userId = this.userContext.getUserId();
    const children = await this.alertChildRepository.findAllByUserId(userId);

    return children.map(AlertChildResponseDto.fromDomain);
  }
}
