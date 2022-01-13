import * as objects from "../../objects";
import { PDFDocumentObject } from "../DocumentObject";
import type { PDFDocumentUpdate } from "../DocumentUpdate";

export class PageTreeNodesDictionary extends objects.PDFDictionary {

  public static readonly TYPE = "Pages";

  /**
   * The type of PDF object that this dictionary describes
   */
  @objects.PDFNameField("Type")
  public type!: string;

  /**
   * The page tree node that is the immediate parent of this one
   */
  @objects.PDFDictionaryField({
    name: "Parent",
    type: PageTreeNodesDictionary,
    optional: true,
  })
  public parent!: PageTreeNodesDictionary | null;

  /**
   * An array of indirect references to the immediate children of this node
   */
  @objects.PDFArrayField("Kids", true)
  public kids!: objects.PDFArray;

  /**
   * The number of leaf nodes (page objects) that are descendants 
   * of this node within the page tree
   */
  @objects.PDFNumberField("Count")
  public count!: number;

  // public modify(update: PDFDocumentUpdate): PageTreeNodesDictionary {
  //   if (this.documentUpdate === update) {
  //     return this;
  //   } else {
  //     const indirect = this.getIndirect();
  //     const obj = this.getDocumentUpdate().getObject(indirect.id, indirect.generation);
  //     update.append(obj);

  //     return new PageTreeNodesDictionary(obj.value as objects.PDFDictionary);
  //   }
  // }

  protected override onCreate(): void {
    const update = this.getDocumentUpdate();


    this.type = PageTreeNodesDictionary.TYPE;
    this.kids = update.document.createArray();
    this.count = 0;
  }

  /**
   * Adds page to Kids
   * @param page 
   */
  public addPage(page: PageObjectDictionary): void {
    this.insertBefore(page);
  }

  public indexOf(page: PageObjectDictionary): number {
    if (this.kids && page.isIndirect()) {
      for (let i = 0; i < this.kids.items.length; i++) {
        const kid = this.kids.items[i];
        const kidRef = kid.getIndirect();
        const pageRef = page.getIndirect();

        if (kidRef.id === pageRef.id && kidRef.generation === pageRef.generation) {
          return i;
        }
      }
    }

    return -1;
  }

  public insertBefore(newPage: PageObjectDictionary, refPage?: PageObjectDictionary): void {
    this.modify();
    newPage.makeIndirect();

    if (refPage) {
      const newIndex = this.indexOf(newPage);
      const refIndex = this.indexOf(refPage);

      if (newIndex !== -1) {
        this.kids.items.splice(newIndex, 1);
      }
      this.kids.items.splice(refIndex, 0, newPage);
    } else {
      this.kids.items.push(newPage);
    }

    this.count = this.kids.length;
    newPage.parent = this;
  }

  public remove(page: PageObjectDictionary | number): void {
    if (typeof page === "number") {
      return this.remove(this.kids.get(page, PageObjectDictionary));
    }

    const pageIndex = this.indexOf(page);

    if (pageIndex !== -1) {
      this.kids.items.splice(pageIndex, 1);

      // TODO Should we remove resources?
      // TODO Change Page status to free

      this.modify();
      this.count = this.kids.length;
      page.parent = this;
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
      page.parent = this;

      // Add Page to the document
      const objPage = documentUpdate.append(page);

      // Update Pages
      this.kids.items.push(objPage.createReference());
      this.count++;

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
      this.kids.items.push(addedPage.createReference());
      this.count++;

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
  public async copyAllRef(element: PDFDocumentObject | objects.PDFObject, secondUpdate: PDFDocumentUpdate, references: Map<string, { id: number, generation: number }> = new Map(), key?: string): Promise<void> {
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
}

import { PageObjectDictionary } from "./PageObject";
