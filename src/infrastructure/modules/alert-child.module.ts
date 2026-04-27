import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from './auth.module';
import { AlertChildController } from '../controllers/alert-child.controller';
import { UpdateChildrenFromExcelUseCase } from 'src/application/use-cases/alert-child/update-children-from-excel.use-case';
import { CHILD_EXCEL_READER } from 'src/domain/constants/tokens';
import { XlsxChildExcelReader } from '../excel/child-excel.parser';
import { AlertChildService } from 'src/application/services/alert-child.service';
import { ContextModule } from 'src/common/contexts/context.module';
import { AuditModule } from './audit.module';

@Module({
  imports: [ContextModule, AuthModule, DatabaseModule, AuditModule],
  controllers: [AlertChildController],
  providers: [
    {
      provide: CHILD_EXCEL_READER,
      useClass: XlsxChildExcelReader,
    },
    UpdateChildrenFromExcelUseCase,
    AlertChildService,
  ],
  exports: [CHILD_EXCEL_READER],
})
export class AlertChildModule {}
