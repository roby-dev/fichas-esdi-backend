import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ContextModule } from 'src/common/context/context.module';
import { AuthModule } from './auth.module';
import { AlertChildController } from '../controllers/alert-child.controller';
import { UpdateChildrenFromExcelUseCase } from 'src/application/use-cases/alert-child/update-children-from-excel.use-case';
import { CHILD_EXCEL_READER } from 'src/domain/constants/tokens';
import { XlsxChildExcelReader } from '../excel/child-excel.parser';
import { FindAlertChildrenByUserIdUseCase } from 'src/application/use-cases/alert-child/find-alert-children-by-user-id.use-case';

@Module({
  imports: [ContextModule, AuthModule, DatabaseModule],
  controllers: [AlertChildController],
  providers: [
    {
      provide: CHILD_EXCEL_READER,
      useClass: XlsxChildExcelReader,
    },
    UpdateChildrenFromExcelUseCase,
    FindAlertChildrenByUserIdUseCase,
  ],
  exports: [CHILD_EXCEL_READER],
})
export class AlertChildModule {}
