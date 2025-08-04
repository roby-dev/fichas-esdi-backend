import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Child as ChildSchema, ChildDocument } from '../schemas/child.schema';
import { ChildRepository } from 'src/domain/repositories/child.repository';
import { Child } from 'src/domain/entities/child.entity';

@Injectable()
export class ChildMongoRepository implements ChildRepository {
  constructor(
    @InjectModel(ChildSchema.name)
    private readonly model: Model<ChildDocument>,
  ) {}

  async save(child: Child): Promise<Child> {
    const created = await this.model.create({
      documentNumber: child.documentNumber,
      firstName: child.firstName,
      lastName: child.lastName,
      birthday: child.birthday,
      admissionDate: child.admissionDate,
      communityHallId: child.communityHallId,
    });

    return Child.fromPrimitives({
      id: created._id.toString(),
      documentNumber: created.documentNumber,
      firstName: created.firstName,
      lastName: created.lastName,
      birthday: created.birthday,
      admissionDate: created.admissionDate,
      communityHallId: created.communityHallId.toString(),
    });
  }

  async update(child: Child): Promise<Child> {
    const updated = await this.model
      .findByIdAndUpdate(
        child.id,
        {
          documentNumber: child.documentNumber,
          firstName: child.firstName,
          lastName: child.lastName,
          birthday: child.birthday,
          admissionDate: child.admissionDate,
          communityHallId: child.communityHallId,
        },
        { new: true },
      )
      .lean();

    if (!updated) throw new Error(`Child with id ${child.id} not found`);

    return Child.fromPrimitives({
      id: updated._id.toString(),
      documentNumber: updated.documentNumber,
      firstName: updated.firstName,
      lastName: updated.lastName,
      birthday: updated.birthday,
      admissionDate: updated.admissionDate,
      communityHallId: updated.communityHallId.toString(),
    });
  }

  async findById(id: string): Promise<Child | null> {
    const doc = await this.model.findById(id).lean();
    if (!doc) return null;

    return Child.fromPrimitives({
      id: doc._id.toString(),
      documentNumber: doc.documentNumber,
      firstName: doc.firstName,
      lastName: doc.lastName,
      birthday: doc.birthday,
      admissionDate: doc.admissionDate,
      communityHallId: doc.communityHallId.toString(),
    });
  }

  async findByDocumentNumber(documentNumber: string): Promise<Child | null> {
    const doc = await this.model.findOne({ documentNumber }).lean();
    if (!doc) return null;

    return Child.fromPrimitives({
      id: doc._id.toString(),
      documentNumber: doc.documentNumber,
      firstName: doc.firstName,
      lastName: doc.lastName,
      birthday: doc.birthday,
      admissionDate: doc.admissionDate,
      communityHallId: doc.communityHallId.toString(),
    });
  }

  async findAll(limit = 10, offset = 0): Promise<Child[]> {
    const docs = await this.model.find().skip(offset).limit(limit).lean();
    return docs.map((doc) =>
      Child.fromPrimitives({
        id: doc._id.toString(),
        documentNumber: doc.documentNumber,
        firstName: doc.firstName,
        lastName: doc.lastName,
        birthday: doc.birthday,
        admissionDate: doc.admissionDate,
        communityHallId: doc.communityHallId.toString(),
      }),
    );
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id);
  }
}
