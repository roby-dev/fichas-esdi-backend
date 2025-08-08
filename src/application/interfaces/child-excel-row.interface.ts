export interface ChildExcelRow {
  managementCommitteCode: number;
  managementCommitteName: string;
  localId: string;
  communityHallName: string;
  childCode: string;
  fatherLastName: string;
  motherLastName: string;
  childNames: string;
  gender: 'F' | 'M';
  admissionDate: string;
  documentNumber: string;
  birthday: string;
}
