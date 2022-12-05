import * as objects from "../../objects";
import { PDFDocument } from "../Document";
import { PDFDocumentObject } from "../DocumentObject";
import type { PDFDocumentUpdate } from "../DocumentUpdate";

function setCount(this: PageTreeNodesDictionary, value: number) {
  const oldValue = this.has("Count") ? this.Count : 0;
  const diff = value - oldValue;
  if (this.Parent) {
    this.Parent.Count += diff;
  }

  return new objects.PDFNumeric(value);
}

function getCount(this: PageTreeNodesDictionary, o: objects.PDFNumeric) {
  return o.value;
}

export class PageTreeNodesDictionary extends objects.PDFDictionary {

  public static readonly TYPE = "Pages";

  public static override create<T extends objects.PDFObject>(this: new () => T, target: PDFDocument | PDFDocumentUpdate, ...items: Array<PageTreeNodesDictionary | PageObjectDictionary>): T {
    const res = super.create(target) as PageTreeNodesDictionary;

    res.push(...items);

    return res as unknown as T;
  }

  /**
   * The type of PDF object that this dictionary describes
   */
  @objects.PDFNameField("Type")
  public Type!: string;

  /**
   * The page tree node that is the immediate parent of this one
   */
  @objects.PDFDictionaryField({
    name: "Parent",
    type: PageTreeNodesDictionary,
    optional: true,
  })
  public Parent!: PageTreeNodesDictionary | null;

  /**
   * An array of indirect references to the immediate children of this node
   */
  @objects.PDFArrayField("Kids", true)
  public Kids!: objects.PDFArray;

  /**
   * The number of leaf nodes (page objects) that are descendants 
   * of this node within the page tree
   */
  @objects.PDFDictionaryField({
    name: "Count",
    type: objects.PDFNumeric,
    get: getCount,
    set: setCount,
  })
  public Count!: number;

  protected override onCreate(): void {
    const update = this.getDocumentUpdate();

    this.Type = PageTreeNodesDictionary.TYPE;
    this.Kids = update.document.createArray();
    this.Count = 0;
  }

  /**
   * Adds page to Kids
   * @param page 
   */
  public addPage(page: PageObjectDictionary): void {
    this.insertBefore(page);
  }

  public indexOf(page: PageObjectDictionary): number {
    return this.Kids.indexOf(page);
  }

  public insertBefore(newPage: PageObjectDictionary, refPage?: PageObjectDictionary): void {
    this.modify();
    newPage.makeIndirect();

    if (refPage) {
      const newIndex = this.indexOf(newPage);
      const refIndex = this.indexOf(refPage);

      if (newIndex !== -1) {
        this.Kids.items.splice(newIndex, 1);
      }
      this.Kids.items.splice(refIndex, 0, newPage);
    } else {
      this.Kids.items.push(newPage);
    }

    this.Count++;
    newPage.Parent = this;
  }

  public remove(page: PageObjectDictionary | number): void {
    if (typeof page === "number") {
      return this.remove(this.Kids.get(page, PageObjectDictionary));
    }

    const pageIndex = this.indexOf(page);

    if (pageIndex !== -1) {
      this.Kids.splice(pageIndex, 1);

      // TODO Should we remove resources?
      // TODO Change Page status to free

      this.Count--;
    }
  }

  /**
   * TODO Remove this method
   * @param page 
   * @returns 
   * @deprecated
   */
  public async addPageOld(page?: PageObjectDictionary | PDFDocumentObject): Promise<PDFDocumentObject> {
    this.modify();
    const documentUpdate = this.getDocumentUpdate();
    let pageDictionary: PageObjectDictionary;
    if (!page) {
      const page = PageObjectDictionary.create(documentUpdate);

      // Set Parent
      page.Parent = this;

      // Add Page to the document
      const objPage = documentUpdate.append(page);

      // Update Pages
      this.Kids.items.push(objPage.createReference());
      this.Count++;

      return objPage;
    } else {
      // Check PDFDocumentObject on PageObjectDictionary
      if (page instanceof PDFDocumentObject) {
        if (page.value instanceof objects.PDFDictionary) {
          const type = page.value.get("Type");
          if (type instanceof objects.PDFName && type.text === "Page") {
            pageDictionary = page.value as PageObjectDictionary;
          } else {
            throw new Error("The page must contain the Page type");
          }
        } else {
          throw new Error("The PDFDocumentObject must contain PageObjectDictionary");
        }
      } else {
        pageDictionary = page;
      }
      // Copy an append new page
      const newPage = pageDictionary.copy();
      const addedPage = documentUpdate.append(newPage);
      const addedPageValue = addedPage.value as PageObjectDictionary;

      // Delete Parent, because we use our catalog
      addedPageValue.delete("Parent");

      // Add page to catalog
      this.Kids.items.push(addedPage.createReference());
      this.Count++;

      // Download all indirect references of object
      if (page.documentUpdate && page.documentUpdate.document !== documentUpdate.document) {
        await this.copyAllRef(addedPage, page.documentUpdate);
      }

      // Set our parent to page
      const ref = this.ownerElement as objects.PDFIndirect;
      addedPageValue.set("Parent", new objects.PDFIndirectReference(ref.id, ref.generation));

      return addedPage;
    }
  }

  /**
   * Download all indirect references of object
   * @param element 
   * @param secondUpdate 
   * @param references 
   * @param key 
   * @returns 
   */
  public async copyAllRef(element: PDFDocumentObject | objects.PDFObject, secondUpdate: PDFDocumentUpdate, references: Map<string, { id: number, generation: number; }> = new Map(), key?: string): Promise<void> {
    if (element instanceof PDFDocumentObject) {
      // PDFDocumentObject
      await this.copyAllRef(element.value, secondUpdate, references);
    } else {
      // PDFObjectTypes
      if (element instanceof objects.PDFIndirectReference) {
        // Create key for map of references
        const mapRef = `${element.id} ${element.generation} R`;

        if (!references.has(mapRef)) {
          // Download object
          const obj = secondUpdate.getObject(element.id, element.generation);
          const copyObj = obj.value.copy();
          if (copyObj instanceof objects.PDFStream) {
            // decode stream, because we use our encrypt handler
            await copyObj.decode();
          }

          const newObj = this.getDocumentUpdate().document.append(copyObj);

          // Update PDFIndirectReference
          element.id = newObj.id;
          element.generation = newObj.generation;
          references.set(mapRef, { id: newObj.id, generation: newObj.generation });
          // console.log(mapRef);

          await this.copyAllRef(newObj, secondUpdate, references);
        } else {
          const newRef = references.get(mapRef);
          if (!newRef) {
            throw new Error("Wrong map reference");
          }
          // Update PDFIndirectReference
          element.id = newRef.id;
          element.generation = newRef.generation;
        }

        // Update PDFIndirectReference in field of dictionary
        if (key) {
          (element.ownerElement as objects.PDFDictionary).set(key, element);
        }
      } else if (element instanceof objects.PDFDictionary) {
        // Check fields of Dictionary
        for (const [key, value] of element.items) {
          // Remove Annots, because he contain all pages document
          if (key === "Annots") {
            element.delete(key);
          } else {
            await this.copyAllRef(value, secondUpdate, references, key);
          }
        }
      } else if (element instanceof objects.PDFArray) {
        // Check items of Array
        for (const obj of element.items) {
          await this.copyAllRef(obj, secondUpdate, references);
        }
      } else {
        return;
      }
    }
  }

  /**
   * Returns all pages of the tree node
   */
  public getPages(): PageObjectDictionary[] {
    const res: PageObjectDictionary[] = [];

    for (let i = 0; i < this.Kids.length; i++) {
      const item = this.Kids.get(i, objects.PDFDictionary, true);
      const type = item.get("Type", objects.PDFName).text;
      switch (type) {
        case PageTreeNodesDictionary.TYPE: {
          const tree = item.to(PageTreeNodesDictionary, true);
          res.push(...tree.getPages());
          break;
        }
        case PageObjectDictionary.TYPE: {
          const page = item.to(PageObjectDictionary, true);
          res.push(page);
          break;
        }
      }
    }

    return res;
  }

  public push(...items: Array<PageTreeNodesDictionary | PageObjectDictionary>): void {
    this.modify();

    for (const item of items) {
      // TODO remove from another document
      // TODO remove from Parent

      this.Kids.push(item);
      item.Parent = this;

      // Update Count
      if (item instanceof PageTreeNodesDictionary) {
        // PageTreeNodesDictionary
        this.Count += item.Count;
      } else {
        // PageObjectDictionary
        this.Count++;
      }
    }
  }

}

import { PageObjectDictionary } from "./PageObject";
