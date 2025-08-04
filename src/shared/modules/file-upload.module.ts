import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FileUploadService } from '../services/file-upload.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        storage: diskStorage({
          destination: (req, file, cb) => {
            const uploadPath = configService.get<string>(
              'UPLOAD_DESTINATION',
              './uploads',
            );
            cb(null, uploadPath);
          },
          filename: (req, file, cb) => {
            const uniqueSuffix =
              Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);
            cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
          },
        }),
        limits: {
          fileSize: configService.get<number>(
            'MAX_FILE_SIZE',
            10 * 1024 * 1024,
          ), // 10MB
        },
        fileFilter: (req, file, cb) => {
          const allowedTypes = configService
            .get<string>('ALLOWED_FILE_TYPES', 'image/*,application/pdf')
            .split(',')
            .map((type) => type.trim());

          const isAllowed = allowedTypes.some((type) => {
            if (type.endsWith('/*')) {
              return file.mimetype.startsWith(type.slice(0, -2));
            }
            return file.mimetype === type;
          });

          if (isAllowed) {
            cb(null, true);
          } else {
            cb(new Error(`File type ${file.mimetype} is not allowed`), false);
          }
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [FileUploadService],
  exports: [FileUploadService, MulterModule],
})
export class FileUploadModule {}
