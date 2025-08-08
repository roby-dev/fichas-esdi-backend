import { ChildExcelRow } from "./child-excel-row.interface";

export interface ChildExcelReader {
  read(file: Express.Multer.File, allowedCommitteeIds: string[]): Promise<ChildExcelRow[]>;
}