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
    if (!file) throw new BadRequestException('Banner media is required');
    const extension = (file.originalname?.slice(file.originalname.lastIndexOf('.')) || '').toLowerCase();
    const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.heic', '.heif']);
    const videoExtensions = new Set(['.mp4', '.webm']);
    const signature = file.buffer?.subarray(0, 8);
    const isPng = signature?.equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const isJpeg = file.buffer?.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
    const isHeif = file.buffer?.toString('ascii', 4, 8) === 'ftyp' && ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(file.buffer.toString('ascii', 8, 12).toLowerCase());
    const isMp4 = file.buffer?.subarray(4, 8).toString('ascii') === 'ftyp';
    const isWebm = file.buffer?.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    const isVideo = videoExtensions.has(extension);
    if ((!imageExtensions.has(extension) || (!isPng && !isJpeg && !isHeif)) && (!isVideo || (!isMp4 && !isWebm))) throw new BadRequestException('Invalid banner media');
    const mediaType = isVideo ? 'VIDEO' : 'IMAGE';
    const stored = await this.imageStorage.store(file.buffer, extension === '.jpeg' ? '.jpg' : extension, file.mimetype, isVideo ? 'video' : 'image');
    return { ...stored, mediaType };
  }
}