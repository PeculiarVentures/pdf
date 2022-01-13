import { PDFDocumentObject } from "./DocumentObject";

function sortById(a: PDFDocumentObject, b: PDFDocumentObject): number {
  if (a.id > b.id) {
    return 1;
  }
  if (a.id < b.id) {
    return -1;
  }

  throw new Error("Cross-Reference cannot have objects with the same identifiers");
}

export class PDFDocumentObjectGrouper {

  public static group(items: PDFDocumentObject[]): PDFDocumentObject[][] {
    const groups: PDFDocumentObject[][] = [];

    if (items.length) {
      // sort by id
      items.sort(sortById);

      // group items
      let lastId = 0;
      let group: PDFDocumentObject[] = [];
      for (const item of items) {
        if (item.id !== lastId + 1) {
          if (group.length) {
            groups.push(group);
            group = [];
          }
        }

        group.push(item);
        lastId = item.id;
      }

      // Add the last group into array
      groups.push(group);
    }

    return groups;
  }
}