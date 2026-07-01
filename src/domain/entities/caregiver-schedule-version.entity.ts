import { v4 as uuidv4 } from 'uuid';

export type ScheduleBlock = {
  id: string;
  name: string;
  entryTime: string; // HH:mm
  exitTime?: string | null; // HH:mm
  exitRequired: boolean;
  toleranceMinutes: number;
  markingWindowMinutes: number;
};

export type DayRule = {
  dayOfWeek: number; // 0 (Sunday) - 6 (Saturday)
  isWorkingDay: boolean;
  blockIds: string[];
};

export type SpecialDay = {
  localDate: string; // YYYY-MM-DD
  isWorkingDay: boolean;
  blockIds: string[];
};

export type CaregiverScheduleVersionPrimitives = {
  id?: string;
  communityHallId: string;
  name: string;
  validFrom: Date;
  validTo?: Date | null;
  blocks: ScheduleBlock[];
  dayRules: DayRule[];
  specialDays?: SpecialDay[];
};

export type CreateCaregiverScheduleVersionInput = {
  communityHallId: string;
  name: string;
  validFrom: Date;
  validTo?: Date | null;
  blocks: (Omit<ScheduleBlock, 'id'> & { id?: string })[];
  dayRules: DayRule[];
  specialDays?: SpecialDay[];
};

export type MarkEvaluation = {
  status: 'on_time' | 'tardy' | 'out_of_window';
  officialEntryTime: string;
};

export class CaregiverScheduleVersion {
  constructor(
    private readonly _communityHallId: string,
    private readonly _name: string,
    private readonly _validFrom: Date,
    private readonly _validTo: Date | null | undefined,
    private readonly _blocks: ScheduleBlock[],
    private readonly _dayRules: DayRule[],
    private readonly _specialDays: SpecialDay[],
    private readonly _id?: string,
  ) {}

  get id(): string | undefined {
    return this._id;
  }

  get communityHallId(): string {
    return this._communityHallId;
  }

  get name(): string {
    return this._name;
  }

  get validFrom(): Date {
    return this._validFrom;
  }

  get validTo(): Date | null | undefined {
    return this._validTo;
  }

  get blocks(): ScheduleBlock[] {
    return this._blocks;
  }

  get dayRules(): DayRule[] {
    return this._dayRules;
  }

  get specialDays(): SpecialDay[] {
    return this._specialDays;
  }

  activeOn(date: Date): boolean {
    const time = date.getTime();
    if (time < this._validFrom.getTime()) return false;
    if (this._validTo && time > this._validTo.getTime()) return false;
    return true;
  }

  private ruleForDate(localDate: Date): DayRule | SpecialDay | undefined {
    const iso = this.toLocalIsoDate(localDate);
    const special = this._specialDays.find((s) => s.localDate === iso);
    if (special) return special;

    return this._dayRules.find((r) => r.dayOfWeek === localDate.getUTCDay());
  }

  isWorkingDay(date: Date): boolean {
    const rule = this.ruleForDate(date);
    return rule?.isWorkingDay ?? false;
  }

  blocksForDate(date: Date): ScheduleBlock[] {
    const rule = this.ruleForDate(date);
    if (!rule || !rule.isWorkingDay) return [];

    return rule.blockIds
      .map((id) => this._blocks.find((b) => b.id === id))
      .filter((b): b is ScheduleBlock => b !== undefined);
  }

  findBlock(id: string): ScheduleBlock | undefined {
    return this._blocks.find((b) => b.id === id);
  }

  evaluateMark(blockId: string, entryTime: string): MarkEvaluation {
    const block = this.findBlock(blockId);
    if (!block)
      return { status: 'out_of_window', officialEntryTime: entryTime };

    const entryMinutes = this.timeToMinutes(block.entryTime);
    const markMinutes = this.timeToMinutes(entryTime);
    const windowEnd = entryMinutes + block.markingWindowMinutes;

    if (markMinutes < entryMinutes || markMinutes > windowEnd) {
      return { status: 'out_of_window', officialEntryTime: entryTime };
    }

    const toleranceEnd = entryMinutes + block.toleranceMinutes;
    const status: MarkEvaluation['status'] =
      markMinutes <= toleranceEnd ? 'on_time' : 'tardy';

    return { status, officialEntryTime: entryTime };
  }

  withSpecialDay(day: SpecialDay): CaregiverScheduleVersion {
    const merged = [
      ...this._specialDays.filter((d) => d.localDate !== day.localDate),
      day,
    ];
    return new CaregiverScheduleVersion(
      this._communityHallId,
      this._name,
      this._validFrom,
      this._validTo,
      this._blocks,
      this._dayRules,
      merged,
      this._id,
    );
  }

  copyToHall(input: {
    communityHallId: string;
    validFrom: Date;
    name: string;
  }): CaregiverScheduleVersion {
    return new CaregiverScheduleVersion(
      input.communityHallId,
      input.name,
      input.validFrom,
      undefined,
      this._blocks.map((b) => ({ ...b, id: uuidv4() as string })),
      this._dayRules,
      this._specialDays,
    );
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private toLocalIsoDate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  static create(
    input: CreateCaregiverScheduleVersionInput,
  ): CaregiverScheduleVersion {
    return new CaregiverScheduleVersion(
      input.communityHallId,
      input.name,
      input.validFrom,
      input.validTo ?? null,
      input.blocks.map((b) => ({ ...b, id: b.id ?? (uuidv4() as string) })),
      input.dayRules,
      input.specialDays ?? [],
    );
  }

  static fromPrimitives(
    data: CaregiverScheduleVersionPrimitives,
  ): CaregiverScheduleVersion {
    return new CaregiverScheduleVersion(
      data.communityHallId,
      data.name,
      data.validFrom,
      data.validTo ?? null,
      data.blocks,
      data.dayRules,
      data.specialDays ?? [],
      data.id,
    );
  }

  toPrimitives(): CaregiverScheduleVersionPrimitives {
    return {
      id: this._id,
      communityHallId: this._communityHallId,
      name: this._name,
      validFrom: this._validFrom,
      validTo: this._validTo,
      blocks: this._blocks,
      dayRules: this._dayRules,
      specialDays: this._specialDays,
    };
  }
}
