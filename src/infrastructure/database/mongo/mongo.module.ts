import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Person, PersonSchema } from './schemas/person.schema';
import {
  CommunityHall,
  CommunityHallSchema,
} from './schemas/community-hall.schema';
import {
  ManagementCommittee,
  ManagementCommitteeSchema,
} from './schemas/management-committee.schema';
import { Child, ChildSchema } from './schemas/child.schema';
import { User, UserSchema } from './schemas/user.schema';
import {
  CHILD_REPOSITORY,
  COMMUNITY_HALL_REPOSITORY,
  MANAGEMENT_COMMITTEE_REPOSITORY,
  PERSON_REPOSITORY,
  USER_REPOSITORY,
} from 'src/domain/constants/tokens';

import { MongoPersonRepository } from './repositories/mongo-person.repository';
import { CommunityHallMongoRepository } from './repositories/community-hall-mongo.repository';
import { ManagementCommitteeMongoRepository } from './repositories/management-comittee-mongo.repository';
import { ChildMongoRepository } from './repositories/child-mongo.repository';
import { UserMongoRepository } from './repositories/user-mongo.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Person.name, schema: PersonSchema },
      { name: CommunityHall.name, schema: CommunityHallSchema },
      { name: ManagementCommittee.name, schema: ManagementCommitteeSchema },
      { name: Child.name, schema: ChildSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [
    {
      provide: PERSON_REPOSITORY,
      useClass: MongoPersonRepository,
    },
    {
      provide: COMMUNITY_HALL_REPOSITORY,
      useClass: CommunityHallMongoRepository,
    },
    {
      provide: MANAGEMENT_COMMITTEE_REPOSITORY,
      useClass: ManagementCommitteeMongoRepository,
    },
    {
      provide: CHILD_REPOSITORY,
      useClass: ChildMongoRepository,
    },
    {
      provide: USER_REPOSITORY,
      useClass: UserMongoRepository,
    },   
  ],
  exports: [
    PERSON_REPOSITORY,
    COMMUNITY_HALL_REPOSITORY,
    MANAGEMENT_COMMITTEE_REPOSITORY,
    CHILD_REPOSITORY,
    USER_REPOSITORY
  ],
})
export class MongoModule {}
