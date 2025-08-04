import {
  PipeTransform,
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { isValidObjectId } from 'mongoose';

@Injectable()
export class ValidateObjectIdPipe implements PipeTransform {
  private readonly logger = new Logger(ValidateObjectIdPipe.name);

  transform(value: string) {
    if (!isValidObjectId(value)) {
      this.logger.warn(`ID inválido: ${value}`);
      throw new BadRequestException(
        'El ID proporcionado no tiene un formato válido',
      );
    }
    return value;
  }
}
