import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

export interface UploadedFileInfo {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  path: string;
}

export interface FileUploadOptions {
  maxSize?: number;
  allowedMimeTypes?: string[];
  generateThumbnail?: boolean;
  optimizeImages?: boolean;
  destination?: string;
}

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly defaultMaxSize = 10 * 1024 * 1024; // 10MB
  private readonly defaultAllowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ];

  constructor(private configService: ConfigService) {}

  async uploadFile(
    file: Express.Multer.File,
    options: FileUploadOptions = {},
  ): Promise<UploadedFileInfo> {
    try {
      // Validate file
      this.validateFile(file, options);

      // Generate file info
      const fileId = uuidv4();
      const fileExtension = this.getFileExtension(file.originalname);
      const fileName = `${fileId}${fileExtension}`;
      const destination =
        options.destination ||
        this.configService.get('UPLOAD_DESTINATION', './uploads');

      // Ensure destination directory exists
      this.ensureDirectoryExists(destination);

      const filePath = join(destination, fileName);
      const fileUrl = `/uploads/${fileName}`;

      // Process and save file
      await this.processAndSaveFile(file, filePath, options);

      this.logger.log(`File uploaded successfully: ${fileName}`);

      return {
        id: fileId,
        fileName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: fileUrl,
        path: filePath,
      };
    } catch (error) {
      this.logger.error(`File upload failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    options: FileUploadOptions = {},
  ): Promise<UploadedFileInfo[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, options));
    return Promise.all(uploadPromises);
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
        this.logger.log(`File deleted: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`, error.stack);
      throw error;
    }
  }

  private validateFile(
    file: Express.Multer.File,
    options: FileUploadOptions,
  ): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const maxSize = options.maxSize || this.defaultMaxSize;
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSize} bytes`,
      );
    }

    const allowedTypes = options.allowedMimeTypes || this.defaultAllowedTypes;
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed`,
      );
    }

    // Additional security checks
    if (this.isExecutableFile(file.originalname)) {
      throw new BadRequestException('Executable files are not allowed');
    }
  }

  private async processAndSaveFile(
    file: Express.Multer.File,
    filePath: string,
    options: FileUploadOptions,
  ): Promise<void> {
    try {
      if (this.isImageFile(file.mimetype) && options.optimizeImages) {
        await this.optimizeImage(file.buffer, filePath);
      } else {
        // Save file directly
        const fs = await import('fs/promises');
        await fs.writeFile(filePath, file.buffer);
      }

      // Generate thumbnail for images
      if (this.isImageFile(file.mimetype) && options.generateThumbnail) {
        await this.generateThumbnail(filePath);
      }
    } catch (error) {
      this.logger.error(
        `Failed to process file: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async optimizeImage(buffer: Buffer, filePath: string): Promise<void> {
    try {
      await sharp(buffer) // Fixed: Use sharp directly
        .resize(1920, 1080, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toFile(filePath);
    } catch (error) {
      this.logger.error(
        `Image optimization failed: ${error.message}`,
        error.stack,
      );
      // Fallback to original file
      const fs = await import('fs/promises');
      await fs.writeFile(filePath, buffer);
    }
  }

  private async generateThumbnail(filePath: string): Promise<void> {
    try {
      const thumbnailPath = filePath.replace(/\.[^/.]+$/, '_thumb.jpg');
      await sharp(filePath) // Fixed: Use sharp directly
        .resize(300, 300, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
    } catch (error) {
      this.logger.error(
        `Thumbnail generation failed: ${error.message}`,
        error.stack,
      );
      // Continue without thumbnail
    }
  }

  private ensureDirectoryExists(directory: string): void {
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true });
    }
  }

  private getFileExtension(filename: string): string {
    const extension = filename.split('.').pop();
    return extension ? `.${extension}` : '';
  }

  private isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  private isExecutableFile(filename: string): boolean {
    const executableExtensions = [
      '.exe',
      '.bat',
      '.cmd',
      '.com',
      '.pif',
      '.scr',
      '.vbs',
      '.js',
    ];
    const extension = this.getFileExtension(filename).toLowerCase();
    return executableExtensions.includes(extension);
  }
}
