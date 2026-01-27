import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from '../../database/entities/attachment.entity';
import { CreateAttachmentDto } from './dto/create-attachment.dto';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private readonly repo: Repository<Attachment>,
  ) {}

  async findAll(page = 1, limit = 20) {
    const take = limit;
    const skip = (page - 1) * limit;
    const [items, total] = await this.repo.findAndCount({
      relations: ['uploader'],
      take,
      skip,
    });
    return { items, total, page, limit };
  }

  findOne(id: string) {
    return this.repo.findOne({ 
      where: { id }, 
      relations: ['uploader'] 
    });
  }

  async findByOwner(ownerType: string, ownerId: string, page = 1, limit = 20) {
    const take = limit;
    const skip = (page - 1) * limit;
    const [items, total] = await this.repo.findAndCount({ 
      where: { ownerType, ownerId },
      relations: ['uploader'],
      take,
      skip,
    });
    return { items, total, page, limit };
  }

  async create(dto: CreateAttachmentDto) {
    const entity = this.repo.create(dto);
    return await this.repo.save(entity);
  }

  async remove(id: string) {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Attachment not found');
    await this.repo.remove(existing);
  }
}
