import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

/**
 * DatabaseProvider - điều khiển kết nối CSDL chung (MySQL/MariaDB)
 * Theo tài liệu: "DatabaseModule: Sử dụng TypeORM kết nối MySQL/MariaDB
 * thông qua database.provider.ts điều khiển kết nối CSDL chung."
 */
export const databaseProvider = {
  provide: 'DATABASE_CONNECTION',
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const dataSource = new DataSource({
      type: 'mysql',
      host: configService.get<string>('DB_HOST', 'localhost'),
      port: configService.get<number>('DB_PORT', 3306),
      username: configService.get<string>('DB_USER', 'root'),
      password: configService.get<string>('DB_PASSWORD', ''),
      database: configService.get<string>('DB_NAME', 'cinema_booking_db'),
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      // DB đã được thiết kế chuẩn hóa sẵn (7 bảng) -> không tự động thay đổi schema
      synchronize: false,
      logging: false,
      charset: 'utf8mb4_unicode_ci',
    });
    return dataSource.initialize();
  },
};

/** Token để inject DataSource ở các module khác: @Inject('DATABASE_CONNECTION') */
