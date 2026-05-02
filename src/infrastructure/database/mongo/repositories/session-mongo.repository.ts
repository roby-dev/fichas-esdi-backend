import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import {
  Session as SessionSchema,
  SessionDocument,
} from '../schemas/session.schema';
import { SessionRepository, SessionPage, UserSessionSummaryPage } from 'src/domain/repositories/session.repository';
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

  async findAll(limit = 10, offset = 0): Promise<SessionPage> {
    const docs = await this.model
      .find()
      .skip(offset)
      .limit(limit)
      .populate('userId')
      .lean();
    const items = docs.map((doc) =>
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
    const total = await this.model.countDocuments();
    return { items, total };
  }

  async update(entity: Session): Promise<Session> {
    const updated = await this.model
      .findByIdAndUpdate(entity.id, { active: entity.active }, { new: true })
      .lean();

    if (!updated) {
      throw new Error(`Session with id ${entity.id} not found`);
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
  ): Promise<SessionPage> {
    const docs = await this.model
      .find({ userId: new Types.ObjectId(userId) })
      .skip(offset)
      .limit(limit)
      .populate('userId')
      .lean();
    const items = docs.map((doc) =>
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
    const total = await this.model.countDocuments({ userId: new Types.ObjectId(userId) });
    return { items, total };
  }

  private convertToUser(raw: any): User {
    return User.fromPrimitives({
      id: raw._id.toString(),
      email: raw.email,
      passwordHash: '',
    });
  }

  async findMany(
    filter: { userId?: string; active?: boolean },
    pagination?: { limit?: number; offset?: number },
  ): Promise<SessionPage> {
    const query: any = {};
    if (filter.userId) query.userId = new Types.ObjectId(filter.userId);
    if (filter.active !== undefined) query.active = filter.active;

    const limit = pagination?.limit ?? 50;
    const offset = pagination?.offset ?? 0;

    const [docs, total] = await Promise.all([
      this.model
        .find(query)
        .skip(offset)
        .limit(limit)
        .populate('userId')
        .lean(),
      this.model.countDocuments(query),
    ]);

    const items = docs.map((doc) =>
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

    return { items, total };
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

  async getSummaryByUser(
    pagination?: { limit?: number; offset?: number },
  ): Promise<UserSessionSummaryPage> {
    const limit = pagination?.limit ?? 50;
    const offset = pagination?.offset ?? 0;

    const pipeline: PipelineStage[] = [
      { $sort: { createdAt: -1 as const } },
      {
        $group: {
          _id: '$userId',
          totalSessions: { $sum: 1 },
          activeSessions: {
            $sum: { $cond: [{ $eq: ['$active', true] }, 1, 0] },
          },
          lastSeenAt: { $first: '$createdAt' },
          lastActive: { $first: '$active' },
          lastIpAddress: { $first: '$ipAddress' },
          lastUserAgent: { $first: '$userAgent' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: { $toString: '$_id' },
          email: '$user.email',
          roles: '$user.roles',
          isOnline: '$lastActive',
          totalSessions: 1,
          activeSessions: 1,
          lastSeenAt: 1,
          lastIpAddress: 1,
          lastUserAgent: 1,
        },
      },
      { $sort: { lastSeenAt: -1 as const } },
    ];

    const [results, countResult] = await Promise.all([
      this.model.aggregate([...pipeline, { $skip: offset }, { $limit: limit }]),
      this.model.aggregate([...pipeline, { $count: 'total' }]),
    ]);

    const total = countResult[0]?.total ?? 0;

    return { items: results, total };
  }
}
