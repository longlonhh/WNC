import { Module, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './config/database.module';
import { JwtAuthGuard } from './common/jwt-auth.guard';
import { RolesGuard } from './common/roles.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MoviesModule } from './modules/movies/movies.module';
import { HallsModule } from './modules/halls/halls.module';
import { ShowtimesModule } from './modules/showtimes/showtimes.module';
import { BookingModule } from './modules/booking/booking.module';
import { StaffModule } from './modules/staff/staff.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Scheduler: tự hủy đơn PENDING quá hạn giữ ghế (Exception Flow 1)
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    UsersModule,
    MoviesModule,
    HallsModule,
    ShowtimesModule,
    BookingModule,
    StaffModule,
    AdminModule,
  ],
  providers: [
    // Toàn cục: mặc định yêu cầu JWT (trừ @Public), sau đó kiểm tra @Roles
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    // Validate DTO tự động
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true, transform: true }),
    },
  ],
})
export class AppModule {}
