import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./auth/auth.module";
import { SchoolsModule } from "./schools/schools.module";
import { UsersModule } from "./users/users.module";
import { ModulesModule } from "./modules/modules.module";
import { HealthModule } from "./health/health.module";
import { StudentsModule } from "./students/students.module";
import { FeesModule } from "./fees/fees.module";
import { AttendanceModule } from "./attendance/attendance.module";
import { TimetableModule } from "./timetable/timetable.module";
import { ExamsModule } from "./exams/exams.module";
import { NoticesModule } from "./notices/notices.module";
import { LibraryModule } from "./library/library.module";
import { ReportsModule } from "./reports/reports.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    PrismaModule,
    AuditModule,
    AuthModule,
    SchoolsModule,
    UsersModule,
    StudentsModule,
    FeesModule,
    AttendanceModule,
    TimetableModule,
    ExamsModule,
    NoticesModule,
    LibraryModule,
    ReportsModule,
    ModulesModule,
    HealthModule,
  ],
})
export class AppModule {}
