import { PDFDictionary } from "../../objects";
import { CryptoFilterDictionary } from "./CryptoFilter";

export class CryptoFiltersDictionary extends PDFDictionary {

  /**
   * Looks for the {@link CryptoFilterDictionary} from the Dictionary
   * @param name name of the filter
   * @returns returns {@link CryptoFilterDictionary} if it exists, otherwise `null`
   */
  public findItem(name: string): CryptoFilterDictionary | null;
  public findItem<T extends CryptoFilterDictionary>(name: string, type: new () => T): T | null;
  public findItem(name: string, type?: any): CryptoFilterDictionary | null {
    if (this.has(name)) {
      return this.get(name, type || CryptoFilterDictionary, true) as CryptoFilterDictionary;
    }

    return null;
  }

  /**
   * Gets {@link CryptoFilterDictionary} from the Dictionary
   * @param name name of the filter
   * @returns returns {@link CryptoFilterDictionary}
   */
  public getItem(name: string): CryptoFilterDictionary;
  public getItem<T extends CryptoFilterDictionary>(name: string, type: new () => T): T;
  public getItem(name: string, type?: any): CryptoFilterDictionary {
    const res = this.findItem(name, type);

    if (!res) {
      throw new Error(`CryptoFilter with name '${name}' not found.`);
    }

    return res;
  }

  /**
   * Adds {@link CryptoFilterDictionary} into the Dictionary
   * @param name name of the filter
   * @param filter filter
   */
  public setFilter(name: string, filter: CryptoFilterDictionary): void {
    this.set(name, filter);
  }

}
