import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { v2 as cloudinary } from 'cloudinary';

export interface StoredImage {
  key: string;
  url: string;
}

export interface ImageStorageProvider {
  store(buffer: Buffer, extension: string, mimeType: string): Promise<StoredImage>;
  remove?(keyOrUrl: string): Promise<void>;
}

@Injectable()
export class LocalImageStorageProvider implements ImageStorageProvider {
  private readonly directory = join(process.cwd(), 'uploads', 'products');

  async store(buffer: Buffer, extension: string, _mimeType: string): Promise<StoredImage> {
    await mkdir(this.directory, { recursive: true });
    const key = `products/${randomUUID()}${extension}`;
    await writeFile(join(process.cwd(), 'uploads', key),
      buffer,
      { flag: 'wx' },
    );
    const publicBaseUrl = process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 4000}`;
    return { key, url: `${publicBaseUrl}/uploads/${key}` };
  }

  async remove(keyOrUrl: string): Promise<void> {
    if (!keyOrUrl.includes('/uploads/products/')) return;
    const key = keyOrUrl.split('/uploads/')[1];
    await unlink(join(process.cwd(), 'uploads', key)).catch(() => undefined);
  }
}

@Injectable()
export class ObjectImageStorageProvider implements ImageStorageProvider {
  async store(_buffer: Buffer, _extension: string, _mimeType: string): Promise<StoredImage> {
    if (!process.env.STORAGE_UPLOAD_URL || !process.env.STORAGE_PUBLIC_URL) {
      throw new BadRequestException('Object storage is not configured');
    }
    throw new BadRequestException('Configure an object-storage adapter before enabling STORAGE_PROVIDER=object');
  }
}

@Injectable()
export class CloudinaryImageStorageProvider implements ImageStorageProvider {
  constructor() {
    if (!process.env.CLOUDINARY_URL) {
      throw new BadRequestException('CLOUDINARY_URL is required when STORAGE_PROVIDER=cloudinary');
    }
    cloudinary.config({ secure: true });
  }

  store(buffer: Buffer, _extension: string, mimeType: string): Promise<StoredImage> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: 'toy-store/products',
          resource_type: 'image',
          public_id: randomUUID(),
          type: 'upload',
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error(`Cloudinary upload failed for ${mimeType}`));
            return;
          }
          resolve({ key: result.public_id, url: result.secure_url });
        },
      );
      upload.end(buffer);
    });
  }

  async remove(keyOrUrl: string): Promise<void> {
    const publicId = keyOrUrl.startsWith('http')
      ? keyOrUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/)?.[1]
      : keyOrUrl;
    if (publicId) await cloudinary.uploader.destroy(publicId, { resource_type: 'image', type: 'upload', invalidate: true });
  }
}

@Injectable()
export class ImageStorageService {
  private readonly provider: ImageStorageProvider =
    process.env.STORAGE_PROVIDER === 'cloudinary'
      ? new CloudinaryImageStorageProvider()
      : process.env.STORAGE_PROVIDER === 'object'
        ? new ObjectImageStorageProvider()
        : new LocalImageStorageProvider();

  async store(buffer: Buffer, extension: string, mimeType: string) {
    return this.provider.store(buffer, extension, mimeType);
  }

  async remove(keyOrUrl: string) {
    return this.provider.remove?.(keyOrUrl);
  }
}
