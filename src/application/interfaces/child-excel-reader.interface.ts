import { ChildExcelRow } from "./child-excel-row.interface";

export interface ChildExcelReader {
  read(file: Express.Multer.File, committeeId: string): Promise<ChildExcelRow[]>;
}