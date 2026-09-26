import { BadRequestException, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductAdminGuard } from '../products/product-admin.guard';
import { ImageStorageService } from '../products/storage.service';

@Controller('banners')
@UseGuards(AuthGuard('jwt'), ProductAdminGuard)
export class BannersController {
  constructor(private imageStorage: ImageStorageService) {}

  @Post('images')
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadImage(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('Banner image is required');
    const extension = (file.originalname?.slice(file.originalname.lastIndexOf('.')) || '').toLowerCase();
    const allowed = new Set(['.jpg', '.jpeg', '.png', '.heic', '.heif']);
    const signature = file.buffer?.subarray(0, 8);
    const isPng = signature?.equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const isJpeg = file.buffer?.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
    if (!allowed.has(extension) || (!isPng && !isJpeg)) throw new BadRequestException('Invalid banner image');
    return this.imageStorage.store(file.buffer, extension === '.jpeg' ? '.jpg' : extension, file.mimetype);
  }
}