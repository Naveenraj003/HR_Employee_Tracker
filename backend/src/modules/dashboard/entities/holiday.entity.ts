import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('holidays', { schema: 'employee' })
export class Holiday {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'holiday_name', type: 'varchar', length: 255 })
  holidayName: string;

  @Column({ name: 'holiday_date', type: 'date' })
  holidayDate: Date;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_optional', type: 'boolean', default: false })
  isOptional: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
