import { Inject, Injectable } from '@nestjs/common';
import { CHILD_REPOSITORY } from 'src/domain/constants/tokens';
import type { ChildRepository } from 'src/domain/repositories/child.repository';
import { AlertChildResponseDto } from '../dtos/alert-child/alert-child-response.dto';

/**
 * Serves the alert-signals views. Reads from the unified `children` collection
 * (not the frozen `alert_children`) and maps to the legacy AlertChildResponseDto
 * shape so the frontend keeps consuming /alert-child without changes.
 *
 * Both Excel-imported and form children carry a denormalized
 * managementCommitteCode, so a committee filter returns the full roster.
 */
@Injectable()
export class AlertChildService {
  constructor(
    @Inject(CHILD_REPOSITORY)
    private readonly childRepository: ChildRepository,
  ) {}

  async findAllByCurrentUser(): Promise<AlertChildResponseDto[]> {
    const children = await this.childRepository.findAllUnpaginated();
    return children.map(AlertChildResponseDto.fromChild);
  }

  async findAllByCurrentUserAndCommitteeCode(
    committeeCode: string,
  ): Promise<AlertChildResponseDto[]> {
    const children =
      await this.childRepository.findAllByManagementCommitteCode(committeeCode);
    return children.map(AlertChildResponseDto.fromChild);
  }
}
