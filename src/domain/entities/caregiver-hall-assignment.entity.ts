export type CaregiverHallAssignmentPrimitives = {
  id?: string;
  caregiverId: string;
  communityHallId: string;
  validFrom: Date;
  validTo?: Date | null;
};

export class CaregiverHallAssignment {
  constructor(
    private readonly _caregiverId: string,
    private readonly _communityHallId: string,
    private readonly _validFrom: Date,
    private readonly _validTo: Date | null | undefined,
    private readonly _id?: string,
  ) {}

  get id(): string | undefined {
    return this._id;
  }

  get caregiverId(): string {
    return this._caregiverId;
  }

  get communityHallId(): string {
    return this._communityHallId;
  }

  get validFrom(): Date {
    return this._validFrom;
  }

  get validTo(): Date | null | undefined {
    return this._validTo;
  }

  isActiveOn(date: Date): boolean {
    const time = date.getTime();
    if (time < this._validFrom.getTime()) return false;
    if (this._validTo && time > this._validTo.getTime()) return false;
    return true;
  }

  close(validTo: Date): CaregiverHallAssignment {
    return new CaregiverHallAssignment(
      this._caregiverId,
      this._communityHallId,
      this._validFrom,
      validTo,
      this._id,
    );
  }

  static create(input: {
    caregiverId: string;
    communityHallId: string;
    validFrom: Date;
  }): CaregiverHallAssignment {
    return new CaregiverHallAssignment(
      input.caregiverId,
      input.communityHallId,
      input.validFrom,
      undefined,
    );
  }

  static fromPrimitives(
    data: CaregiverHallAssignmentPrimitives,
  ): CaregiverHallAssignment {
    return new CaregiverHallAssignment(
      data.caregiverId,
      data.communityHallId,
      data.validFrom,
      data.validTo ?? null,
      data.id,
    );
  }

  toPrimitives(): CaregiverHallAssignmentPrimitives {
    return {
      id: this._id,
      caregiverId: this._caregiverId,
      communityHallId: this._communityHallId,
      validFrom: this._validFrom,
      validTo: this._validTo,
    };
  }
}
