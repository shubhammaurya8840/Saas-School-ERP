import { Module } from "@nestjs/common";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";
import { PrismaModule } from "../prisma/prisma.module";
import { FeesModule } from "../fees/fees.module";
import { ExamsModule } from "../exams/exams.module";
import { AttendanceModule } from "../attendance/attendance.module";
import { LibraryModule } from "../library/library.module";

@Module({
  imports: [
    PrismaModule,
    FeesModule,
    ExamsModule,
    AttendanceModule,
    LibraryModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
