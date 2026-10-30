"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseProvider = void 0;
const typeorm_1 = require("typeorm");
const config_1 = require("@nestjs/config");
exports.databaseProvider = {
    provide: 'DATABASE_CONNECTION',
    inject: [config_1.ConfigService],
    useFactory: async (configService) => {
        const dataSource = new typeorm_1.DataSource({
            type: 'mysql',
            host: configService.get('DB_HOST', 'localhost'),
            port: configService.get('DB_PORT', 3306),
            username: configService.get('DB_USER', 'root'),
            password: configService.get('DB_PASSWORD', ''),
            database: configService.get('DB_NAME', 'cinema_booking_db'),
            entities: [__dirname + '/../**/*.entity{.ts,.js}'],
            synchronize: false,
            logging: false,
            charset: 'utf8mb4_unicode_ci',
        });
        return dataSource.initialize();
    },
};
//# sourceMappingURL=database.provider.js.map