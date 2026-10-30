import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ToggleStaffPermissionDto {
  @IsBoolean()
  @IsNotEmpty()
  canManageNotices: boolean;
}
