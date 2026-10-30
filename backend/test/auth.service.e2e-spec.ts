import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

describe('AuthModule (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // TODO: import thực tế module backend và khởi tạo application
    // expect true for placeholder
  });

  afterAll(async () => {
    // TODO: close app
  });

  it('placeholder: backend e2e test placeholder', () => {
    expect(true).toBe(true);
  });
});
