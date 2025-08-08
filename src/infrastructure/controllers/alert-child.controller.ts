import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../guards/jwt-auth.guard';
import { BulkUpdateDto } from 'src/application/dtos/alert-child/bulk-update.dto';
import { BulkUpdateResponseDto } from 'src/application/dtos/alert-child/bulk-update-response.dto';
import { UpdateChildrenFromExcelUseCase } from 'src/application/use-cases/alert-child/update-children-from-excel.use-case';

@ApiTags('alert-child')
@Controller('alert-child')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard)
export class AlertChildController {
  constructor(
    private readonly updateChildrenFromExcelUseCase: UpdateChildrenFromExcelUseCase,
  ) {}

  @Post('bulk-update')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: BulkUpdateDto })
  @ApiOperation({ summary: 'Bulk update children from an Excel file' })
  @ApiResponse({ status: 200, type: BulkUpdateResponseDto })
  async bulkUpdateFromExcel(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<BulkUpdateResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required.');
    }

    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only .xls or .xlsx files are allowed.',
      );
    }

    await this.updateChildrenFromExcelUseCase.execute(file);

    return {
      ok: true,
      message:
        'Niños actualizados correctamente',
    };
  }
}
