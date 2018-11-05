import { Controller, Param, Body, Get, Post, Put, Delete } from 'routing-controllers';

@Controller()
export class TestController {

  @Get('/test')
  get() {
    return 'test data';
  }

  @Post("/users")
  post(@Body() user: any) {
    return `Recived - ${user}`;
  }

}

export const testController = new TestController();
