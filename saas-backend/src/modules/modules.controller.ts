import { Controller, Get } from "@nestjs/common";
import { ModulesService } from "./modules.service";

@Controller("modules")
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Get()
  getAvailableModules() {
    return this.modulesService.getAvailableModules();
  }
}
