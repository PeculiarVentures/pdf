import * as objects from "../../objects";

export type NameTreeIterator = [string, objects.PDFObject];

export type NameTreeType = typeof NameTree.EMPTY | typeof NameTree.ROOT | typeof NameTree.INTERMEDIATE | typeof NameTree.LEAF;

export class NameTree extends objects.PDFDictionary implements Iterable<NameTreeIterator> {

  public static EMPTY = "empty";
  public static ROOT = "root";
  public static INTERMEDIATE = "intermediate";
  public static LEAF = "leaf";

  public get type(): NameTreeType {
    if (this.has("Names")) {
      if (this.has("Limits")) {
        return NameTree.LEAF;
      }

      return NameTree.ROOT;
    }

    if (this.has("Kids")) {
      if (this.has("Limits")) {
        return NameTree.INTERMEDIATE;
      }

      return NameTree.ROOT;
    }

    return NameTree.EMPTY;
  }

  /**
   * Shall be an array of indirect references to the immediate children of this node.
   * The children may be intermediate or leaf nodes.
   *
   * @remarks
   * Root and intermediate nodes only; required in intermediate nodes; present in the root node
   * if and only if Names is not present
   *
  */
  @objects.PDFArrayField("Kids", true)
  public Kids!: objects.PDFArray | null;

  /**
   * An array of elements which are the leaves of the names tree
   *
   * Shall be an array of the form
   * ```
   * [key1 value1 key2 value2 ... keyN valueN ]
   * ```
   * where each keyI shall be a string and the corresponding valueI shall be the object associated with that key.
   * The keys shall be sorted in lexical order.
   *
   * @remarks
   * Root and leaf nodes only; required in leaf nodes; present in the root node if and only if Kids is not present
   */
  @objects.PDFArrayField("Names", true)
  public Names!: objects.PDFArray | null;

  /**
   * Shall be an array of two strings, that shall specify the (lexically) least and greatest keys
   * included in the Names array of a leaf node or in the Names arrays of any leaf nodes
   * that are descendants of an intermediate node.
   *
   * @remarks
   * Required for intermediate and leaf nodes; not permitted in root nodes
   */
  @objects.PDFArrayField("Limits", true)
  public Limits!: objects.PDFArray | null;

  /**
   * Recursively adds key-value pairs from the NameTree to the provided array in
   * the format of an array of tuples of strings and PDFObjects.
   * @remarks
   * The resulting array will contain all key-value pairs in the NameTree in
   * lexicographical order.
   * @param res - The array to add key-value pairs to
   * @returns The array of key-value pairs
   */
  #toArray(res: Array<NameTreeIterator>) {
    if (this.Names) {
      for (let i = 0; i < this.Names.length; i += 2) {
        const key = this.Names.get(i, objects.PDFTextString).text;
        const value = this.Names.get(i + 1);
        res.push([key, value]);
      }
    }

    if (this.Kids) {
      for (const kid of this.Kids) {
        if (!(kid instanceof objects.PDFDictionary)) {
          continue;
        }

        kid.to(NameTree).#toArray(res);
      }
    }

    return res;
  }

  /**
   * Returns an array of key-value pairs from the NameTree object.
   * @returns Returns an array of key-value pairs
   */
  public toArray(): Array<NameTreeIterator> {
    return this.#toArray([]);
  }

  [Symbol.iterator](): Iterator<NameTreeIterator, unknown, undefined> {
    let pointer = 0;
    const array = this.toArray();

    return {
      next(): IteratorResult<NameTreeIterator> {
        if (pointer < array.length) {
          return {
            done: false,
            value: array[pointer++]
          };
        } else {
          return {
            done: true,
            value: null
          };
        }
      }
    };
  }

  /**
   * This method searches for a value within a NameTree based on a specified key.
   * @param key Represents the key to be searched for in the tree
   * @returns Returns the corresponding PDFObject, or null if no such value exists
   */
  public findValue(key: string): objects.PDFObject | null {
    // If this is an intermediate node with Limits, verify that the key is within the range
    if (this.compare(key)) {
      return null;
    }

    // If this is a leaf node with Names, search for the key
    if (this.Names) {
      for (let i = 0; i < this.Names.length; i += 2) {
        const keyItem = this.Names.get(i, objects.PDFTextString).text;
        if (keyItem === key) {
          return this.Names.get(i + 1);
        }
      }
    }

    // If this is an intermediate node with Kids, recursively search them for the key
    if (this.Kids) {
      for (const kid of this.Kids) {
        if (!(kid instanceof objects.PDFDictionary)) {
          continue;
        }

        const res = kid.to(NameTree).findValue(key);
        if (res) {
          return res;
        }
      }
    }

    return null;
  }

  /**
   * Returns the value associated with the given key, casting it to the given type if possible.
   * @param key The key whose associated value should be retrieved
   * @param type The type to which the associated value should be cast
   * @returns the value associated with the given key, cast to the given type
   * @throws `Error` if the value associated with the given key cannot be retrieved
   * @throws `TypeError` if the value associated with the given key cannot be cast to the given type
   */
  public getValue<T extends objects.PDFObject>(key: string, type?: new () => T): T;
  /**
   * Returns the value associated with the given key.
   * @param key The key whose associated value should be retrieved
   * @returns the value associated with the given key
   * @throws `Error` if the value associated with the given key cannot be retrieved
   */
  public getValue(key: string): objects.PDFObject;
  public getValue(key: string, type?: new () => objects.PDFObject): objects.PDFObject {
    const res = this.findValue(key);
    if (!res) {
      throw new Error(`Cannot retrieve the value for the given key '${key}'.`);
    }

    if (type && !(res instanceof type)) {
      throw new TypeError("Unable to cast value to type because the types do not match.");
    }

    return res;
  }

  /**
   * Returns an array of all the keys in the NameTree object.
   * @returns Returns an array of keys
   */
  public keys(): string[] {
    return this.toArray().map(([k]) => k);
  }

  /**
   * Returns an array of all the entries in the NameTree object.
   * @returns Returns an array of entries
   */
  public entries(): objects.PDFObject[] {
    return this.toArray().map(([, v]) => v);
  }

  public compare(key: string): number {
    if (this.Limits) {
      // Intermediate or Leaf
      const first = this.Limits.get(0, objects.PDFTextString).text;
      if (first > key) {
        return -1;
      }

      const last = this.Limits.get(1, objects.PDFTextString).text;
      if (key > last) {
        return 1;
      }
    }

    // Root
    return 0;
  }

}
