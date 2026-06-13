import { Controller, Get, Header } from '@nestjs/common';
import { Public } from '../auth/roles.decorator';
import { LANDING_HTML } from './landing-ui';

@Controller()
export class LandingController {
  @Public()
  @Get(['/', 'landing'])
  @Header('Content-Type', 'text/html; charset=utf-8')
  getLanding() {
    return LANDING_HTML;
  }
}
