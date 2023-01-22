import { PDFDictionary } from "../../objects";
import { CryptoFilterDictionary } from "./CryptoFilter";

export class CryptoFiltersDictionary extends PDFDictionary {

  /**
   * Looks for the {@link CryptoFilterDictionary} from the Dictionary
   * @param name name of the filter
   * @returns returns {@link CryptoFilterDictionary} if it exists, otherwise `null`
   */
  public findItem(name: string): CryptoFilterDictionary | null {
    if (this.has(name)) {
      return this.get(name, CryptoFilterDictionary, true);
    }

    return null;
  }

  /**
   * Gets {@link CryptoFilterDictionary} from the Dictionary
   * @param name name of the filter
   * @returns returns {@link CryptoFilterDictionary}
   */
  public getItem(name: string): CryptoFilterDictionary {
    const res = this.findItem(name);

    if (!res) {
      throw new Error(`CryptoFilter with name '${name}' no found.`);
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
