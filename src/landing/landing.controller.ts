import { Controller, Get, Header, StreamableFile } from '@nestjs/common';
import { Public } from '../auth/roles.decorator';
import { LANDING_HTML } from './landing-ui';
import { FAVICON_ICO } from './favicon.assets';

@Controller()
export class LandingController {
  @Public()
  @Get(['/', 'landing'])
  @Header('Content-Type', 'text/html; charset=utf-8')
  getLanding() {
    return LANDING_HTML;
  }

  @Public()
  @Get('favicon.ico')
  @Header('Content-Type', 'image/x-icon')
  @Header('Cache-Control', 'public, max-age=604800')
  getFavicon() {
    return new StreamableFile(FAVICON_ICO);
  }
}
