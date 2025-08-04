import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { UserRepository } from 'src/domain/repositories/user.repository';
import { User } from 'src/domain/entities/user.entity';
import { User as UserSchema, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UserMongoRepository implements UserRepository {
  constructor(
    @InjectModel(UserSchema.name)
    private readonly model: Model<UserDocument>,
  ) {}

  async findAll(limit = 10, offset = 0): Promise<User[]> {
    const docs = await this.model.find().skip(offset).limit(limit).lean();
    return docs.map((doc) =>
      User.fromPrimitives({
        email: doc.email,
        passwordHash: doc.passwordHash,
        roles: doc.roles,
        id: doc.id,
      }),
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.model.findOne({ email }).exec();
    return doc
      ? User.fromPrimitives({
          email: doc.email,
          passwordHash: doc.passwordHash,
          roles: doc.roles,
          id: doc.id,
        })
      : null;
  }

  async findById(id: string): Promise<User | null> {
    const doc = await this.model.findById(id).exec();
    return doc
      ? User.fromPrimitives({
          email: doc.email,
          passwordHash: doc.passwordHash,
          roles: doc.roles,
          id: doc.id,
        })
      : null;
  }

  async save(user: User): Promise<User> {
    const raw = user.toPrimitives();
    const doc = await this.model.create({
      email: raw.email,
      passwordHash: raw.passwordHash,
      roles: raw.roles,
    });

    return User.fromPrimitives({
      email: doc.email,
      passwordHash: doc.passwordHash,
      roles: doc.roles,
      id: doc.id,
    });
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id);
  }

  async update(entity: User): Promise<User> {
    const data = entity.toPrimitives();
    const doc = await this.model.findByIdAndUpdate(
      entity.id,
      {
        email: data.email,
        roles: data.roles,
      },
      {
        new: true,
      },
    );

    if (!doc) {
      throw new Error(`User with id ${entity.id} not found`);
    }

    return User.fromPrimitives({
      email: doc.email,
      passwordHash: doc.passwordHash,
      roles: doc.roles,
      id: doc.id,
    });
  }
}
