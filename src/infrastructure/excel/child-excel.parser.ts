import * as XLSX from 'xlsx';
import { Injectable } from '@nestjs/common';
import { ChildExcelReader } from 'src/application/interfaces/child-excel-reader.interface';
import { ChildExcelRow } from 'src/application/interfaces/child-excel-row.interface';

@Injectable()
export class XlsxChildExcelReader implements ChildExcelReader {
  async read(
    file: Express.Multer.File,
    allowedCommitteeIds: string[],
  ): Promise<ChildExcelRow[]> {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: null,
    });

    const headerRowIndex = rows.findIndex((row) =>
      row.some(
        (cell) =>
          typeof cell === 'string' &&
          cell.trim().toUpperCase() === 'CUI DEL CG',
      ),
    );
    if (headerRowIndex === -1) {
      throw new Error('No se encontró la fila con encabezado "CUI del CG"');
    }

    const headers = rows[headerRowIndex].map((h) =>
      h ? String(h).trim() : '',
    );

    const headerMap: Record<string, keyof ChildExcelRow> = {
      'CUI del CG': 'managementCommitteCode',
      'Nombre de Comité de Gestión': 'managementCommitteName',
      LOCAL_ID: 'localId',
      'Nombre del Local': 'communityHallName',
      'Código de Usuario': 'childCode',
      'Apellido Paterno del Usuario': 'fatherLastName',
      'Apellido Materno del Usuario': 'motherLastName',
      'Nombre del Usuario': 'childNames',
      'Sexo del Usuario\r\nF: Femenino\r\nM: Masculino': 'gender',
      'Fecha de registro del usuario al programa': 'admissionDate',
      'Numero de documento del usuario': 'documentNumber',
      'Fecha de Nacimiento del usuario': 'birthday',
    };

    const cuiColIndex = headers.indexOf('CUI del CG');
    const dataRows = rows.slice(headerRowIndex + 1).filter((row) => {
      const cuiValue = row[cuiColIndex];
      return allowedCommitteeIds.includes(String(cuiValue).trim());
    });

    return dataRows.map((row) => {
      const obj = {} as ChildExcelRow;
      for (const originalHeader in headerMap) {
        const targetProp = headerMap[originalHeader];
        const colIndex = headers.indexOf(originalHeader);
        let value =
          colIndex !== -1 && row[colIndex] !== undefined ? row[colIndex] : null;

        if (
          targetProp === 'managementCommitteCode' ||
          targetProp === 'localId' ||
          targetProp === 'childCode'
        ) {
          value = Number(value);
        } else if (targetProp === 'gender' && typeof value === 'string') {
          value = value.trim().toUpperCase() === 'M' ? 'M' : 'F';
        } else if (typeof value === 'string') {
          value = value.trim();
        }

        (obj as any)[targetProp] = value;
      }
      return obj;
    });
  }
}
