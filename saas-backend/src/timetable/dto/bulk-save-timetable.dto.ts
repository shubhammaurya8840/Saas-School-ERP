import { IsArray, ValidateNested, IsNotEmpty } from "class-validator";
import { Type } from "class-transformer";
import { SaveTimetableSlotDto } from "./save-timetable-slot.dto";

export class BulkSaveTimetableDto {
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SaveTimetableSlotDto)
  slots: SaveTimetableSlotDto[];
}
