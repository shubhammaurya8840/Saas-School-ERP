import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ExamsService } from './exams.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { CreateExamDto } from './dto/create-exam.dto';
import { CreateExamPaperDto } from './dto/create-exam-paper.dto';
import { EnterMarksDto } from './dto/enter-marks.dto';
import { UpdateExamStatusDto } from './dto/update-exam-status.dto';
import { CreateGradingRuleDto } from './dto/create-grading-rule.dto';

@Controller('exams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  // 1. Create Exam Event (Admin & authorized teachers)
  @Post()
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @HttpCode(HttpStatus.CREATED)
  async createExam(
    @CurrentUser('schoolId') schoolId: string,
    @Body() dto: CreateExamDto,
    @CurrentUser() user: any,
  ) {
    return this.examsService.createExam(schoolId, dto, user);
  }

  // 2. Add Paper to Exam
  @Post(':id/papers')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @HttpCode(HttpStatus.CREATED)
  async addExamPaper(
    @CurrentUser('schoolId') schoolId: string,
    @Param('id') examId: string,
    @Body() dto: CreateExamPaperDto,
  ) {
    return this.examsService.addExamPaper(schoolId, examId, dto);
  }

  // 3. List Exams
  @Get()
  @Roles(
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
  )
  async listExams(
    @CurrentUser('schoolId') schoolId: string,
    @Query('academicYear') academicYear: string,
    @Query('classSectionId') classSectionId: string,
    @Query('status') status: string,
    @CurrentUser() user: any,
  ) {
    return this.examsService.listExams(
      schoolId,
      { academicYear, classSectionId, status },
      user,
    );
  }

  // 4. Grading Rules: List & Create
  @Get('grading-rules')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getGradingRules(
    @CurrentUser('schoolId') schoolId: string,
    @Query('academicYear') academicYear: string,
  ) {
    return this.examsService.getGradingRules(schoolId, academicYear);
  }

  @Post('grading-rules')
  @Roles(UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createGradingRule(
    @CurrentUser('schoolId') schoolId: string,
    @Body() dto: CreateGradingRuleDto,
  ) {
    return this.examsService.createGradingRule(schoolId, dto);
  }

  // 5. Parent Multi-Child Report Cards
  @Get('parent/children-report-cards')
  @Roles(UserRole.PARENT, UserRole.SCHOOL_ADMIN)
  async getParentChildrenReportCards(
    @CurrentUser('schoolId') schoolId: string,
    @CurrentUser() user: any,
  ) {
    return this.examsService.getParentChildrenReportCards(schoolId, user);
  }

  // 6. Get Single Exam Details
  @Get(':id')
  @Roles(
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
  )
  async getExamById(
    @CurrentUser('schoolId') schoolId: string,
    @Param('id') examId: string,
    @CurrentUser() user: any,
  ) {
    return this.examsService.getExamById(schoolId, examId, user);
  }

  // 7. Enter/Update Student Marks (Teacher assigned check, validation, safe upsert)
  @Post(':id/marks')
  @Roles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.OK)
  async enterMarks(
    @CurrentUser('schoolId') schoolId: string,
    @Param('id') examId: string,
    @Body() dto: EnterMarksDto,
    @CurrentUser() user: any,
  ) {
    return this.examsService.enterMarks(schoolId, examId, dto, user);
  }

  // 8. Update Result Status (Draft, Reviewed, Published)
  @Patch(':id/status')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async updateExamStatus(
    @CurrentUser('schoolId') schoolId: string,
    @Param('id') examId: string,
    @Body() dto: UpdateExamStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.examsService.updateExamStatus(schoolId, examId, dto.status, user);
  }

  // 9. Marks Sheet Roster
  @Get(':id/marks-sheet')
  @Roles(
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
  )
  async getExamMarksSheet(
    @CurrentUser('schoolId') schoolId: string,
    @Param('id') examId: string,
    @Query('paperId') paperId: string,
    @CurrentUser() user: any,
  ) {
    return this.examsService.getExamMarksSheet(schoolId, examId, paperId, user);
  }

  // 10. Printable Report Card (with student info, subject marks, totals, percentage, grade & attendance)
  @Get(':id/report-card/:studentId')
  @Roles(
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
  )
  async getReportCard(
    @CurrentUser('schoolId') schoolId: string,
    @Param('id') examId: string,
    @Param('studentId') studentId: string,
    @CurrentUser() user: any,
  ) {
    return this.examsService.getReportCard(schoolId, examId, studentId, user);
  }
}
