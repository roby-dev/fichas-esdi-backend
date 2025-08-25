import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Session as SessionSchema,
  SessionDocument,
} from '../schemas/session.schema';
import { SessionRepository } from 'src/domain/repositories/session.repository';
import { Session } from 'src/domain/entities/session.entity';
import { User } from 'src/domain/entities/user.entity';

@Injectable()
export class SessionMongoRepository implements SessionRepository {
  constructor(
    @InjectModel(SessionSchema.name)
    private readonly model: Model<SessionDocument>,
  ) {}

  async save(session: Session): Promise<Session> {
    const data = session.toPrimitives();
    const created = await this.model.create({
      userId: new Types.ObjectId(data.userId),
      tokenId: data.tokenId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });

    return Session.fromPrimitives({
      id: created._id.toString(),
      userId: created.userId._id.toString(),
      tokenId: created.tokenId,
      active: created.active,
      ipAddress: created.ipAddress,
      userAgent: created.userAgent,
    });
  }

  async findById(id: string): Promise<Session | null> {
    const doc = await this.model.findById(id).populate('userId').lean();
    if (!doc) return null;

    return Session.fromPrimitives({
      id: doc._id.toString(),
      userId: doc.userId._id.toString(),
      tokenId: doc.tokenId,
      active: doc.active,
      ipAddress: doc.ipAddress,
      userAgent: doc.userAgent,
      user:
        typeof doc.userId === 'object'
          ? this.convertToUser(doc.userId)
          : undefined,
    });
  }

  async findAll(limit = 10, offset = 0): Promise<Session[]> {
    const docs = await this.model
      .find()
      .skip(offset)
      .limit(limit)
      .populate('userId')
      .lean();
    return docs.map((doc) =>
      Session.fromPrimitives({
        id: doc._id.toString(),
        userId: doc.userId._id.toString(),
        tokenId: doc.tokenId,
        active: doc.active,
        ipAddress: doc.ipAddress,
        userAgent: doc.userAgent,
        user:
          typeof doc.userId === 'object'
            ? this.convertToUser(doc.userId)
            : undefined,
      }),
    );
  }

  async update(entity: Session): Promise<Session> {
    const updated = await this.model
      .findByIdAndUpdate(entity.id, { active: entity.active }, { new: true })
      .lean();

    if (!updated) {
      throw new Error(`ManagementCommittee with id ${entity.id} not found`);
    }

    return Session.fromPrimitives({
      id: updated._id.toString(),
      userId: updated.userId._id.toString(),
      tokenId: updated.tokenId,
      active: updated.active,
      ipAddress: updated.ipAddress,
      userAgent: updated.userAgent,
    });
  }

  async findAllByUserId(
    userId: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<Session[]> {
    const docs = await this.model
      .find({ userId: new Types.ObjectId(userId) })
      .skip(offset)
      .limit(limit)
      .populate('userId')
      .lean();
    return docs.map((doc) =>
      Session.fromPrimitives({
        id: doc._id.toString(),
        userId: doc.userId._id.toString(),
        tokenId: doc.tokenId,
        active: doc.active,
        ipAddress: doc.ipAddress,
        userAgent: doc.userAgent,
        user:
          typeof doc.userId === 'object'
            ? this.convertToUser(doc.userId)
            : undefined,
      }),
    );
  }

  private convertToUser(raw: any): User {
    return User.fromPrimitives({
      id: raw._id.toString(),
      email: raw.email,
      passwordHash: '',
    });
  }

  async updateByTokenId(
    tokenId: string,
    active: boolean = false,
    ipAddress: string | string[] | undefined,
    userAgent: string | undefined,
  ): Promise<Session | null> {
    const updated = await this.model
      .findOneAndUpdate(
        { tokenId },
        { active, ipAddress, userAgent },
        { new: true },
      )
      .lean();

    if (!updated) {
      throw new Error(`Session con tokenId ${tokenId} no se encontró`);
    }

    return Session.fromPrimitives({
      id: updated!._id.toString(),
      userId: updated!.userId._id.toString(),
      tokenId: updated!.tokenId,
      active: updated!.active,
      ipAddress: updated!.ipAddress,
      userAgent: updated!.userAgent,
    });
  }
}
