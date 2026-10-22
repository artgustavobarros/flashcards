import { BadRequestException, type PipeTransform } from "@nestjs/common";
import { prettifyError, type z } from "zod";

// Validates a body or param with a schema from @daruma/shared: @Body(new ZodPipe(schema)).
export class ZodPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: z.ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException(prettifyError(result.error));
    }
    return result.data;
  }
}
