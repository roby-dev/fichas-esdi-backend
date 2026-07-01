import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CaregiverMother } from 'src/domain/entities/caregiver-mother.entity';
import { CaregiverMotherRepository } from 'src/domain/repositories/caregiver-mother.repository';
import {
  CaregiverMother as CaregiverMotherSchema,
  CaregiverMotherDocument,
} from '../schemas/caregiver-mother.schema';

@Injectable()
export class CaregiverMotherMongoRepository
  implements CaregiverMotherRepository
{
  constructor(
    @InjectModel(CaregiverMotherSchema.name)
    private readonly model: Model<CaregiverMotherDocument>,
  ) {}

  async save(caregiver: CaregiverMother): Promise<CaregiverMother> {
    const p = caregiver.toPrimitives();
    const created = await this.model.create({
      documentType: p.documentType,
      documentNumber: p.documentNumber,
      firstName: p.firstName,
      lastName: p.lastName,
      fullName: p.fullName,
      phone: p.phone,
      startDate: p.startDate,
      endDate: p.endDate ?? null,
      status: p.status,
    });
    return this.toDomain(created);
  }

  async update(caregiver: CaregiverMother): Promise<CaregiverMother> {
    const p = caregiver.toPrimitives();
    const updated = await this.model
      .findByIdAndUpdate(
        caregiver.id,
        {
          documentType: p.documentType,
          documentNumber: p.documentNumber,
          firstName: p.firstName,
          lastName: p.lastName,
          fullName: p.fullName,
          phone: p.phone,
          startDate: p.startDate,
          endDate: p.endDate ?? null,
          status: p.status,
        },
        { new: true },
      )
      .lean();

    if (!updated) {
      throw new Error(`CaregiverMother with id ${caregiver.id} not found`);
    }
    return this.toDomain(updated);
  }

  async findById(id: string): Promise<CaregiverMother | null> {
    const doc = await this.model.findById(id).lean();
    return doc ? this.toDomain(doc) : null;
  }

  async findByIdentity(
    documentType: string,
    documentNumber: string,
  ): Promise<CaregiverMother | null> {
    const doc = await this.model
      .findOne({ documentType, documentNumber })
      .lean();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(limit = 10, offset = 0): Promise<CaregiverMother[]> {
    const docs = await this.model.find().skip(offset).limit(limit).lean();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findByIds(ids: string[]): Promise<CaregiverMother[]> {
    const docs = await this.model
      .find({ _id: { $in: ids.map((id) => new Types.ObjectId(id)) } })
      .lean();
    return docs.map((doc) => this.toDomain(doc));
  }

  async existsByIdentity(
    documentType: string,
    documentNumber: string,
  ): Promise<boolean> {
    const count = await this.model.countDocuments({
      documentType,
      documentNumber,
    });
    return count > 0;
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id);
  }

  private toDomain(doc: any): CaregiverMother {
    return CaregiverMother.fromPrimitives({
      id: doc._id.toString(),
      documentType: doc.documentType,
      documentNumber: doc.documentNumber,
      firstName: doc.firstName,
      lastName: doc.lastName,
      fullName: doc.fullName,
      phone: doc.phone,
      startDate: doc.startDate,
      endDate: doc.endDate,
      status: doc.status,
    });
  }
}
