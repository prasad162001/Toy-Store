import { BadRequestException, Controller, Param, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ProductAdminGuard } from './product-admin.guard';
import { ProductsService } from './products.service';
import { ImageStorageService } from './storage.service';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.heic', '.heif']);

function detectImageType(buffer: Buffer): { extension: string; mimeType: string } | null {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return { extension: '.png', mimeType: 'image/png' };
  }
  if (buffer.length >= 3 && buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) {
    return { extension: '.jpg', mimeType: 'image/jpeg' };
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buffer.toString('ascii', 8, 12).toLowerCase();
    if (brand === 'heic' || brand === 'heix' || brand === 'hevc' || brand === 'hevx' || brand === 'mif1' || brand === 'msf1') {
      return { extension: brand === 'mif1' || brand === 'msf1' ? '.heif' : '.heic', mimeType: 'image/heic' };
    }
  }
  return null;
}

@Controller('products')
@UseGuards(AuthGuard('jwt'), ProductAdminGuard)
export class ProductsController {
  constructor(
    private productsService: ProductsService,
    private imageStorage: ImageStorageService,
  ) {}

  @Post(':productId/images')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 10 }], { limits: { fileSize: MAX_IMAGE_SIZE } }))
  async uploadImages(@Param('productId') productId: string, @UploadedFiles() files: { images?: any[] }) {
    const product = await this.productsService.getProductForAdmin(productId);
    const images = files?.images || [];
    if (images.length === 0) {
      throw new BadRequestException('At least one image is required');
    }

    const stored = [];
    for (const file of images) {
      const originalExtension = (file.originalname?.slice(file.originalname.lastIndexOf('.')) || '').toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(originalExtension) || file.size > MAX_IMAGE_SIZE) {
        throw new BadRequestException('Upload failed. Please select a valid JPG, JPEG, PNG or HEIC image under 10 MB');
      }
      const detected = detectImageType(file.buffer);
      if (!detected || (detected.extension !== originalExtension && !(detected.extension === '.jpg' && originalExtension === '.jpeg'))) {
        throw new BadRequestException('Image content does not match its file extension');
      }
      const image = await this.imageStorage.store(file.buffer, detected.extension, detected.mimeType);
      stored.push(await this.productsService.addProductImage(product.id, image.url, stored.length === 0, stored.length));
    }
    return stored;
  }
}
