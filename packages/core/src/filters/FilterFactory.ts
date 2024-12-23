import { PDFDictionary } from "../objects/Dictionary";
import { ASCII85Filter } from "./ASCII85Filter";
import { ASCIIHexFilter } from "./ASCIIHexFilter";
import { CCITTFaxFilter } from "./CCITTFaxFilter";
import { CryptFilter } from "./CryptFilter";
import { DCTFilter } from "./DCTFilter";
import { Filter } from "./Filter";
import { FlateFilter } from "./FlateFilter";
import { JBIG2Filter } from "./JBIG2Filter";
import { JPXFilter } from "./JPXFilter";
import { LZWFilter } from "./LZWFilter";
import { RunLengthFilter } from "./RunLengthFilter";

export interface FilterConstructor {
  new (decodeParams?: PDFDictionary | null): Filter;
  NAME: string;
}

export class FilterFactory {
  public static filters = new Map<string, FilterConstructor>([
    [ASCII85Filter.NAME, ASCII85Filter],
    [ASCIIHexFilter.NAME, ASCIIHexFilter],
    [CCITTFaxFilter.NAME, CCITTFaxFilter],
    [DCTFilter.NAME, DCTFilter],
    [FlateFilter.NAME, FlateFilter],
    [JBIG2Filter.NAME, JBIG2Filter],
    [JPXFilter.NAME, JPXFilter],
    [LZWFilter.NAME, LZWFilter],
    [RunLengthFilter.NAME, RunLengthFilter],
    [CryptFilter.NAME, CryptFilter]
  ]);

  public static register(filter: FilterConstructor): void {
    this.filters.set(filter.name, filter);
  }

  public static get(type: string): FilterConstructor {
    const filter = this.filters.get(type);
    if (!filter) {
      throw new Error(`Filter ${type} not found`);
    }

    return filter;
  }
}
