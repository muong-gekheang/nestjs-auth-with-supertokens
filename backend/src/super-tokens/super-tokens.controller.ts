import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SuperTokensService } from './super-tokens.service';
import { CreateSuperTokenDto } from './dto/create-super-token.dto';
import { UpdateSuperTokenDto } from './dto/update-super-token.dto';

@Controller('super-tokens')
export class SuperTokensController {
  constructor(private readonly superTokensService: SuperTokensService) {}

  // @Post()
  // create(@Body() createSuperTokenDto: CreateSuperTokenDto) {
  //   return this.superTokensService.create(createSuperTokenDto);
  // }

  // @Get()
  // findAll() {
  //   return this.superTokensService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.superTokensService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateSuperTokenDto: UpdateSuperTokenDto) {
  //   return this.superTokensService.update(+id, updateSuperTokenDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.superTokensService.remove(+id);
  // }
}
