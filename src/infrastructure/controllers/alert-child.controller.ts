import {
  BadRequestException,
  Body,
  Controller,
  Get,
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
import { AlertChildResponseDto } from 'src/application/dtos/alert-child/alert-child-response.dto';
import { FindAlertChildrenByUserIdUseCase } from 'src/application/use-cases/alert-child/find-alert-children-by-user-id.use-case';

@ApiTags('alert-child')
@Controller('alert-child')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard)
export class AlertChildController {
  constructor(
    private readonly updateChildrenFromExcelUseCase: UpdateChildrenFromExcelUseCase,
    private readonly findAlertChildrenByUserIdUseCase: FindAlertChildrenByUserIdUseCase,
  ) {}

  @Post('bulk-update')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: BulkUpdateDto })
  @ApiOperation({ summary: 'Bulk update children from an Excel file' })
  @ApiResponse({ status: 200, type: BulkUpdateResponseDto })
  async bulkUpdateFromExcel(
    @Body() dto: Omit<BulkUpdateDto, 'file'>,
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

    var result = await this.updateChildrenFromExcelUseCase.execute({
      file,
      ...dto,
    });

    return {
      ok: true,
      message: 'Niños actualizados correctamente',
      data: result,
    };
  }

  @Get('')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Obtener niños por usuario logeado' })
  @ApiResponse({ status: 200, type: [AlertChildResponseDto] })
  async findAllByUser(): Promise<AlertChildResponseDto[]> {
    return await this.findAlertChildrenByUserIdUseCase.execute();
  }
}
