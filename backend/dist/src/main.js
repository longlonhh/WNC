"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const dotenv = require("dotenv");
dotenv.config();
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
                callback(null, true);
            }
            else {
                callback(null, true);
            }
        },
        credentials: true,
    });
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`🎬 Cinema API đang chạy tại http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map