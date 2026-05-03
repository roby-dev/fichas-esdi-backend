import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Param,
  UploadedFile,
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
import { BulkUpdateDto } from 'src/application/dtos/alert-child/bulk-update.dto';
import { BulkUpdateResponseDto } from 'src/application/dtos/alert-child/bulk-update-response.dto';
import { UpdateChildrenFromExcelUseCase } from 'src/application/use-cases/alert-child/update-children-from-excel.use-case';
import { AlertChildResponseDto } from 'src/application/dtos/alert-child/alert-child-response.dto';
import { AlertChildService } from 'src/application/services/alert-child.service';

@ApiTags('alert-child')
@Controller('alert-child')
@ApiBearerAuth('access-token')
export class AlertChildController {
  constructor(
    private readonly updateChildrenFromExcelUseCase: UpdateChildrenFromExcelUseCase,
    private readonly service: AlertChildService,
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
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only .xls or .xlsx files are allowed.',
      );
    }

    const result = await this.updateChildrenFromExcelUseCase.execute({
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
  @ApiOperation({ summary: 'Obtener niños por usuario logeado' })
  @ApiResponse({ status: 200, type: [AlertChildResponseDto] })
  async findAllByUser(): Promise<AlertChildResponseDto[]> {
    return await this.service.findAllByCurrentUser();
  }

  @Get('committee/:committeeCode')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Obtener niños por usuario logeado y comité' })
  @ApiResponse({ status: 200, type: [AlertChildResponseDto] })
  async findAllByUserAndCommittee(
    @Param('committeeCode') committeeCode: string,
  ): Promise<AlertChildResponseDto[]> {
    return await this.service.findAllByCurrentUserAndCommitteeCode(committeeCode);
  }
}
