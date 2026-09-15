import { Test, TestingModule } from '@nestjs/testing';
import { SeoController } from './seo.controller.js';

describe('SeoController', () => {
  let controller: SeoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeoController],
    }).compile();

    controller = module.get<SeoController>(SeoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
