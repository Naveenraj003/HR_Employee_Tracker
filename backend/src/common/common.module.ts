import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { EventLog } from './entities/event-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, EventLog])],
  exports: [TypeOrmModule],
})
export class CommonModule {}
