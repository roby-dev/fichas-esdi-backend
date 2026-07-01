import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../guards/public.decorator';
import { Roles } from '../guards/roles.decorator';
import { ValidateObjectIdPipe } from 'src/common/pipes/validate-obect-id.pipe';
import { CaregiverMotherService } from 'src/application/services/caregiver-mother.service';
import { CaregiverScheduleService } from 'src/application/services/caregiver-schedule.service';
import { CaregiverAttendanceMarkingService } from 'src/application/services/caregiver-attendance-marking.service';
import { CaregiverAttendanceExceptionService } from 'src/application/services/caregiver-attendance-exception.service';
import { CaregiverAttendanceReportService } from 'src/application/services/caregiver-attendance-report.service';
import { CreateCaregiverMotherDto } from 'src/application/dtos/caregiver-attendance/create-caregiver-mother.dto';
import { UpdateCaregiverMotherDto } from 'src/application/dtos/caregiver-attendance/update-caregiver-mother.dto';
import { TransferCaregiverMotherDto } from 'src/application/dtos/caregiver-attendance/transfer-caregiver-mother.dto';
import { CaregiverMotherResponseDto } from 'src/application/dtos/caregiver-attendance/caregiver-mother-response.dto';
import { CreateScheduleVersionDto } from 'src/application/dtos/caregiver-attendance/create-schedule-version.dto';
import { CopyScheduleVersionDto } from 'src/application/dtos/caregiver-attendance/copy-schedule-version.dto';
import { ScheduleVersionResponseDto } from 'src/application/dtos/caregiver-attendance/schedule-version-response.dto';
import { SelfServiceMarkDto } from 'src/application/dtos/caregiver-attendance/self-service-mark.dto';
import { AssistedMarkDto } from 'src/application/dtos/caregiver-attendance/assisted-mark.dto';
import { CorrectMarkDto } from 'src/application/dtos/caregiver-attendance/correct-mark.dto';
import { MarkResponseDto } from 'src/application/dtos/caregiver-attendance/mark-response.dto';
import { CreateExceptionDto } from 'src/application/dtos/caregiver-attendance/create-exception.dto';
import { ExceptionResponseDto } from 'src/application/dtos/caregiver-attendance/exception-response.dto';
import type { CaregiverHallAssignmentPrimitives } from 'src/domain/entities/caregiver-hall-assignment.entity';
import { MonthlyReportQueryDto } from 'src/application/dtos/caregiver-attendance/monthly-report-query.dto';
import { MonthlyHallReportResponseDto } from 'src/application/dtos/caregiver-attendance/monthly-hall-report-response.dto';
import { MonthlyCommitteeReportResponseDto } from 'src/application/dtos/caregiver-attendance/monthly-committee-report-response.dto';

interface RequestWithUser extends Request {
  user: { sub: string; email: string; roles: string[] };
}

@ApiTags('caregiver-attendance')
@Controller('caregiver-attendance')
@ApiBearerAuth('access-token')
export class CaregiverAttendanceController {
  constructor(
    private readonly caregiverService: CaregiverMotherService,
    private readonly scheduleService: CaregiverScheduleService,
    private readonly markingService: CaregiverAttendanceMarkingService,
    private readonly exceptionService: CaregiverAttendanceExceptionService,
    private readonly reportService: CaregiverAttendanceReportService,
  ) {}

  private roles(req: RequestWithUser): string[] {
    return req.user?.roles ?? [];
  }

  @Get('caregivers')
  @Roles(['admin', 'AT'])
  @ApiOperation({ summary: 'List caregiver mothers' })
  @ApiResponse({ status: 200, type: [CaregiverMotherResponseDto] })
  async findAll(
    @Req() req: RequestWithUser,
    @Query('limit') limit = '10',
    @Query('offset') offset = '0',
  ): Promise<CaregiverMotherResponseDto[]> {
    return this.caregiverService.findAll(
      this.roles(req),
      Number(limit),
      Number(offset),
    );
  }

  @Post('caregivers')
  @Roles(['admin', 'AT'])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a caregiver mother' })
  @ApiResponse({ status: 201, type: CaregiverMotherResponseDto })
  async create(
    @Req() req: RequestWithUser,
    @Body() dto: CreateCaregiverMotherDto,
  ): Promise<CaregiverMotherResponseDto> {
    return this.caregiverService.create(dto, this.roles(req));
  }

  @Get('caregivers/:id')
  @Roles(['admin', 'AT'])
  @ApiOperation({ summary: 'Get caregiver mother by ID' })
  @ApiResponse({ status: 200, type: CaregiverMotherResponseDto })
  async findById(
    @Req() req: RequestWithUser,
    @Param('id', ValidateObjectIdPipe) id: string,
  ): Promise<CaregiverMotherResponseDto> {
    return this.caregiverService.findById(id, this.roles(req));
  }

  @Patch('caregivers/:id')
  @Roles(['admin', 'AT'])
  @ApiOperation({ summary: 'Update caregiver mother' })
  @ApiResponse({ status: 200, type: CaregiverMotherResponseDto })
  async update(
    @Req() req: RequestWithUser,
    @Param('id', ValidateObjectIdPipe) id: string,
    @Body() dto: UpdateCaregiverMotherDto,
  ): Promise<CaregiverMotherResponseDto> {
    return this.caregiverService.update(id, dto, this.roles(req));
  }

  @Post('caregivers/:id/transfers')
  @Roles(['admin', 'AT'])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Transfer caregiver to another community hall' })
  async transfer(
    @Req() req: RequestWithUser,
    @Param('id', ValidateObjectIdPipe) id: string,
    @Body() dto: TransferCaregiverMotherDto,
  ): Promise<void> {
    await this.caregiverService.transfer(id, dto, this.roles(req));
  }

  @Get('caregivers/:id/assignments')
  @Roles(['admin', 'AT'])
  @ApiOperation({ summary: 'List assignment history for a caregiver' })
  async findAssignments(
    @Req() req: RequestWithUser,
    @Param('id', ValidateObjectIdPipe) id: string,
  ): Promise<CaregiverHallAssignmentPrimitives[]> {
    return this.caregiverService.findAssignments(id, this.roles(req));
  }

  @Post('schedules')
  @Roles(['admin', 'AT'])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a schedule version' })
  @ApiResponse({ status: 201, type: ScheduleVersionResponseDto })
  async createSchedule(
    @Req() req: RequestWithUser,
    @Body() dto: CreateScheduleVersionDto,
  ): Promise<ScheduleVersionResponseDto> {
    return this.scheduleService.create(dto, this.roles(req));
  }

  @Get('schedules/:id')
  @Roles(['admin', 'AT'])
  @ApiOperation({ summary: 'Get schedule version by ID' })
  @ApiResponse({ status: 200, type: ScheduleVersionResponseDto })
  async findScheduleById(
    @Req() req: RequestWithUser,
    @Param('id', ValidateObjectIdPipe) id: string,
  ): Promise<ScheduleVersionResponseDto> {
    return this.scheduleService.findById(id, this.roles(req));
  }

  @Get('schedules/hall/:hallId')
  @Roles(['admin', 'AT'])
  @ApiOperation({ summary: 'List schedule versions for a hall' })
  @ApiResponse({ status: 200, type: [ScheduleVersionResponseDto] })
  async findSchedulesByHall(
    @Req() req: RequestWithUser,
    @Param('hallId', ValidateObjectIdPipe) hallId: string,
  ): Promise<ScheduleVersionResponseDto[]> {
    return this.scheduleService.findByHallId(hallId, this.roles(req));
  }

  @Post('schedules/:id/copy')
  @Roles(['admin', 'AT'])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Copy a schedule version to another hall' })
  @ApiResponse({ status: 201, type: ScheduleVersionResponseDto })
  async copySchedule(
    @Req() req: RequestWithUser,
    @Param('id', ValidateObjectIdPipe) id: string,
    @Body() dto: CopyScheduleVersionDto,
  ): Promise<ScheduleVersionResponseDto> {
    return this.scheduleService.copyToHall(id, dto, this.roles(req));
  }

  @Post('marks/self-service')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Self-service attendance mark' })
  @ApiResponse({ status: 201, type: MarkResponseDto })
  async selfServiceMark(
    @Body() dto: SelfServiceMarkDto,
  ): Promise<MarkResponseDto> {
    return this.markingService.selfServiceMark(dto);
  }

  @Post('marks/assisted')
  @Roles(['admin', 'AT'])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assisted attendance mark' })
  @ApiResponse({ status: 201, type: MarkResponseDto })
  async assistedMark(
    @Req() req: RequestWithUser,
    @Body() dto: AssistedMarkDto,
  ): Promise<MarkResponseDto> {
    return this.markingService.assistedMark(dto, this.roles(req));
  }

  @Patch('marks/:id/correction')
  @Roles(['admin', 'AT'])
  @ApiOperation({ summary: 'Correct an attendance mark' })
  @ApiResponse({ status: 200, type: MarkResponseDto })
  async correctMark(
    @Req() req: RequestWithUser,
    @Param('id', ValidateObjectIdPipe) id: string,
    @Body() dto: CorrectMarkDto,
  ): Promise<MarkResponseDto> {
    return this.markingService.correctMark(id, dto, this.roles(req));
  }

  @Post('exceptions')
  @Roles(['admin', 'AT'])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create attendance exception' })
  @ApiResponse({ status: 201, type: ExceptionResponseDto })
  async createException(
    @Req() req: RequestWithUser,
    @Body() dto: CreateExceptionDto,
  ): Promise<ExceptionResponseDto> {
    return this.exceptionService.create(dto, this.roles(req));
  }

  @Get('exceptions/hall/:hallId')
  @Roles(['admin', 'AT'])
  @ApiOperation({ summary: 'List hall exceptions for a date' })
  @ApiResponse({ status: 200, type: [ExceptionResponseDto] })
  async findHallExceptions(
    @Req() req: RequestWithUser,
    @Param('hallId', ValidateObjectIdPipe) hallId: string,
    @Query('localDate') localDate: string,
  ): Promise<ExceptionResponseDto[]> {
    return this.exceptionService.findByHallAndDate(
      hallId,
      localDate,
      this.roles(req),
    );
  }

  @Get('reports/halls/:hallId/monthly')
  @Roles(['admin', 'AT'])
  @ApiOperation({ summary: 'Monthly hall attendance report' })
  @ApiResponse({ status: 200, type: MonthlyHallReportResponseDto })
  async hallMonthlyReport(
    @Req() req: RequestWithUser,
    @Param('hallId', ValidateObjectIdPipe) hallId: string,
    @Query() query: MonthlyReportQueryDto,
  ): Promise<MonthlyHallReportResponseDto> {
    const includeExpected = query.includeExpectedWithoutMarks === 'true';
    return this.reportService.hallMonthlyReport(
      hallId,
      query.year,
      query.month,
      includeExpected,
      this.roles(req),
    );
  }

  @Get('reports/committees/:committeeId/monthly')
  @Roles(['admin', 'AT'])
  @ApiOperation({ summary: 'Monthly committee attendance report' })
  @ApiResponse({ status: 200, type: MonthlyCommitteeReportResponseDto })
  async committeeMonthlyReport(
    @Req() req: RequestWithUser,
    @Param('committeeId', ValidateObjectIdPipe) committeeId: string,
    @Query() query: MonthlyReportQueryDto,
  ): Promise<MonthlyCommitteeReportResponseDto> {
    const includeExpected = query.includeExpectedWithoutMarks === 'true';
    return this.reportService.committeeMonthlyReport(
      committeeId,
      query.year,
      query.month,
      includeExpected,
      this.roles(req),
    );
  }
}
