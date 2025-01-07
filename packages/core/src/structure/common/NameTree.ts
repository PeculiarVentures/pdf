import * as objects from "../../objects";

export type NameTreeIterator = [string, objects.PDFObject, NameTree];

export type NameTreeType =
  | typeof NameTree.EMPTY
  | typeof NameTree.ROOT
  | typeof NameTree.INTERMEDIATE
  | typeof NameTree.LEAF;

/**
 * Represents a NameTree object in a PDF document.
 */
export class NameTree
  extends objects.PDFDictionary
  implements Iterable<NameTreeIterator>
{
  public static EMPTY = "empty";
  public static ROOT = "root";
  public static INTERMEDIATE = "intermediate";
  public static LEAF = "leaf";

  /** Parent NameTree */
  private parent?: NameTree;

  /**
   * Gets the type of the NameTree object.
   */
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

  private leafArray(res: NameTree[] = []): NameTree[] {
    if (this.Names) {
      res.push(this);
    }

    if (this.Kids) {
      for (let i = 0; i < this.Kids.length; i++) {
        const kid = this.Kids.get(i, NameTree, true);

        // Set parent for each child. This is needed for Limits update in setValue
        kid.parent = this;

        kid.leafArray(res);
      }
    }

    return res;
  }

  /**
   * Returns an array of key-value pairs from the NameTree object.
   * @returns Returns an array of key-value pairs
   */
  public toArray(): NameTreeIterator[] {
    const res: NameTreeIterator[] = [];

    const leafs = this.leafArray();
    for (const leaf of leafs) {
      if (leaf.Names) {
        for (let i = 0; i < leaf.Names.length; i += 2) {
          const key = leaf.Names.get(i, objects.PDFTextString).text;
          const value = leaf.Names.get(i + 1);
          res.push([key, value, leaf]);
        }
      }
    }

    return res;
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

  private findValueIterator(key: string): NameTreeIterator | null {
    // If this is an intermediate node with Limits, verify that the key is within the range
    if (this.compare(key)) {
      return null;
    }

    // If this is a leaf node with Names, search for the key
    if (this.Names) {
      for (let i = 0; i < this.Names.length; i += 2) {
        const keyItem = this.Names.get(i, objects.PDFTextString).text;
        if (keyItem === key) {
          return [key, this.Names.get(i + 1), this];
        }
      }
    }

    // If this is an intermediate node with Kids, recursively search them for the key
    if (this.Kids) {
      for (const kid of this.Kids) {
        if (!(kid instanceof objects.PDFDictionary)) {
          continue;
        }

        const res = kid.to(NameTree).findValueIterator(key);
        if (res) {
          return res;
        }
      }
    }

    return null;
  }

  /**
   * This method searches for a value within a NameTree based on a specified key.
   * @param key Represents the key to be searched for in the tree
   * @returns Returns the corresponding PDFObject, or null if no such value exists
   */
  public findValue(key: string): objects.PDFObject | null {
    const res = this.findValueIterator(key);

    if (res) {
      return res[1];
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
  public getValue<T extends objects.PDFObject>(
    key: string,
    type?: new () => T
  ): T;
  /**
   * Returns the value associated with the given key.
   * @param key The key whose associated value should be retrieved
   * @returns the value associated with the given key
   * @throws `Error` if the value associated with the given key cannot be retrieved
   */
  public getValue(key: string): objects.PDFObject;
  public getValue(
    key: string,
    type?: new () => objects.PDFObject
  ): objects.PDFObject {
    const res = this.findValue(key);
    if (!res) {
      throw new Error(`Cannot retrieve the value for the given key '${key}'.`);
    }

    if (type && !(res instanceof type)) {
      throw new TypeError(
        "Unable to cast value to type because the types do not match."
      );
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

  /**
   * Compares Limits to a given key string.
   * @param key The key string to compare with.
   * @returns
   * `-1` if the first limit is greater than the key,
   * `0` if the key is within the limits, and
   * `1` if the last limit is less than the key.
   */
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

  /**
   * Returns the first element of the tree. If the tree is empty, returns null.
   * @returns The first element of the tree, or null if the tree is empty.
   */
  public first(): NameTreeIterator | null {
    if (this.Limits) {
      // Intermediate or Leaf
      const first = this.Limits.get(0, objects.PDFTextString).text;

      return this.findValueIterator(first);
    }

    // Root with Names
    if (this.Names && this.Names.length) {
      const key = this.Names.get(0, objects.PDFTextString).text;
      const value = this.Names.get(1);

      return [key, value, this];
    }

    // Root with Kids
    if (this.Kids && this.Kids.length) {
      return this.Kids.get(0, NameTree).first();
    }

    return null;
  }

  /**
   * Returns the last element of the tree. If the tree is empty, returns null.
   * @returns The first element of the tree, or null if the tree is empty.
   */
  public last(): NameTreeIterator | null {
    if (this.Limits) {
      // Intermediate or Leaf
      const last = this.Limits.get(1, objects.PDFTextString).text;

      return this.findValueIterator(last);
    }

    // Root with Names
    if (this.Names && this.Names.length) {
      const i = this.Names.length;
      const key = this.Names.get(i - 2, objects.PDFTextString).text;
      const value = this.Names.get(i - 1);

      return [key, value, this];
    }

    // Root with Kids
    if (this.Kids && this.Kids.length) {
      return this.Kids.get(this.Kids.length - 1, NameTree).last();
    }

    return null;
  }

  /**
   * Sets the value of the given key.
   *
   * @param key The key to set the value for.
   * @param value The value to set for the given key.
   * @throws `` if the given key cannot be set.
   */
  public setValue(key: string, value: objects.PDFObject): void {
    const leafs = this.leafArray();

    // Get a Leaf NameTree for the value adding
    let target: NameTree | null = null;
    for (const leaf of leafs) {
      const compare = leaf.compare(key);
      if (compare === 0) {
        target = leaf;
        break;
      } else if (compare === -1) {
        if (!target) {
          target = leaf;
        }
        break;
      }
      target = leaf;
    }

    // Check the Leaf NameTree
    if (!target || !target.Names) {
      throw new Error("Cannot set value for the empty NameTree.");
    }

    // Convert Names to map
    const map = new Map<string, objects.PDFObject>();
    for (const [k, v] of target) {
      map.set(k, v);
    }
    map.set(key, value);

    // Sort keys
    const sortedKeys = [...map.keys()].sort();

    // Recreate array
    const array = new objects.PDFArray();
    for (const k of sortedKeys) {
      const v = map.get(k);
      if (!v) {
        continue;
      }

      // Dictionary, Array and Strings shall be indirect objects
      if (
        v instanceof objects.PDFDictionary ||
        v instanceof objects.PDFArray ||
        v instanceof objects.PDFTextString
      ) {
        v.makeIndirect();
      }

      array.push(new objects.PDFLiteralString(k), v as objects.PDFObjectTypes);
    }
    target.Names = array;

    // Update Limits
    let parent: NameTree | undefined = target;
    while (parent && parent.Limits && parent.compare(key)) {
      const min = parent.Limits.get(0, objects.PDFTextString);
      if (min.text > key) {
        min.text = key;
      } else {
        parent.Limits.get(1, objects.PDFTextString).text = key;
      }

      parent = parent.parent;
    }
  }
}
