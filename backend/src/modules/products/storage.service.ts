import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

export interface StoredImage {
  key: string;
  url: string;
}

export interface ImageStorageProvider {
  store(buffer: Buffer, extension: string, mimeType: string): Promise<StoredImage>;
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
export class ImageStorageService {
  private readonly provider: ImageStorageProvider =
    process.env.STORAGE_PROVIDER === 'object'
      ? new ObjectImageStorageProvider()
      : new LocalImageStorageProvider();

  async store(buffer: Buffer, extension: string, mimeType: string) {
    return this.provider.store(buffer, extension, mimeType);
  }
}
