import { Inject, Injectable } from '@nestjs/common';
import { ALERT_CHILD_REPOSITORY } from 'src/domain/constants/tokens';
import type { AlertChildRepository } from 'src/domain/repositories/alert-child.repository';
import { RequestUserContext } from 'src/common/contexts/user-context.service';
import { AlertChildResponseDto } from '../dtos/alert-child/alert-child-response.dto';

@Injectable()
export class AlertChildService {
  constructor(
    @Inject(ALERT_CHILD_REPOSITORY)
    private readonly alertChildRepository: AlertChildRepository,
    private readonly userContext: RequestUserContext,
  ) {}

  async findAllByCurrentUser(): Promise<AlertChildResponseDto[]> {
    const userId = this.userContext.getUserId();
    const children = await this.alertChildRepository.findAllByUserId(userId);
    return children.map(AlertChildResponseDto.fromDomain);
  }

  async findAllByCurrentUserAndCommitteeCode(committeeCode: string): Promise<AlertChildResponseDto[]> {
    const userId = this.userContext.getUserId();
    const children = await this.alertChildRepository.findAllByUserIdAndCommitteeCode(userId, committeeCode);
    return children.map(AlertChildResponseDto.fromDomain);
  }
}
