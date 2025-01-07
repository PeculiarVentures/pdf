import * as core from "@peculiar/pdf-core";
import { PDFDocument } from "../Document";
import { FormComponent } from "./FormComponent";
import { PDFPage } from "../Page";

describe("FormComponent", () => {
  let doc: PDFDocument;
  let page: PDFPage;
  let component: FormComponent;

  beforeEach(async () => {
    doc = await PDFDocument.create();
    page = doc.pages.create();
    const widget = core.WidgetDictionary.create(doc.target);
    widget.Parent = core.PDFField.create(doc.target);
    component = new FormComponent(widget, doc);
  });

  describe("dimensions", () => {
    beforeEach(() => {
      component.target.rect = doc.target.createRectangle(0, 0, 100, 50);
    });

    it("should get/set width", () => {
      expect(component.width).toBe(100);

      component.width = 200;
      expect(component.width).toBe(200);
      expect(component.target.rect.toString()).toBe("[ 0, 0, 200, 50 ]");
    });

    it("should get/set height", () => {
      expect(component.height).toBe(50);

      component.height = 75;
      expect(component.height).toBe(75);
      expect(component.target.rect.toString()).toBe("[ 0, -25, 100, 50 ]");
    });

    it("should get/set left position", () => {
      expect(component.left).toBe(0);

      component.left = 25;
      expect(component.left).toBe(25);
      expect(component.target.rect.toString()).toBe("[ 25, 0, 125, 50 ]");
    });

    it("should get/set top position", () => {
      expect(component.top).toBe(50);

      component.top = 100;
      expect(component.top).toBe(100);
      expect(component.target.rect.urY).toBe(100);
      expect(component.target.rect.toString()).toBe("[ 0, 50, 100, 100 ]");
    });

    it("should get/set dimensions on page", () => {
      page.target.addAnnot(component.target);

      expect(component.top).toBe(791.89);
      expect(component.left).toBe(0);
      expect(component.width).toBe(100);
      expect(component.height).toBe(50);

      // Change dimensions
      component.top = 500;
      component.left = 100;
      component.width = 200;
      component.height = 100;

      expect(component.top).toBe(500);
      expect(component.target.rect.urY).toBe(341.89);
      expect(component.left).toBe(100);
      expect(component.target.rect.llX).toBe(100);
      expect(component.width).toBe(200);
      expect(component.target.rect.urX).toBe(300);
      expect(component.height).toBe(100);
      expect(component.target.rect.llY).toBe(241.89);
    });
  });

  describe("borderWidth", () => {
    it("should get/set border width", () => {
      expect(component.borderWidth).toBe(1);

      component.borderWidth = 2;
      expect(component.borderWidth).toBe(2);
      expect(component.target.BS.get(true).W).toBe(2);
    });
  });

  describe("colors", () => {
    it("should get/set border color", () => {
      component.borderColor = [1, 0, 0]; // red
      expect(component.borderColor).toEqual([1, 0, 0]);
      expect(component.target.MK.get().BC?.toString()).toBe("[ 1, 0, 0 ]");
    });

    it("should get/set background color", () => {
      component.backgroundColor = [0, 1, 0]; // green
      expect(component.backgroundColor).toEqual([0, 1, 0]);
      expect(component.target.MK.get().BG?.toString()).toBe("[ 0, 1, 0 ]");
    });

    it("should get/set fore color", () => {
      component.foreColor = [0, 0, 1]; // blue
      expect(component.foreColor).toEqual([0, 0, 1]);
      expect(component.target.MK.get().get("PV_FC")?.toString()).toBe(
        "(0 0 1 rg)"
      );
    });
  });

  describe("annotation flags", () => {
    it("should get/set hidden flag", () => {
      component.hidden = true;
      expect(component.hidden).toBe(true);
      expect(component.target.f & core.AnnotationFlags.hidden).toBe(
        core.AnnotationFlags.hidden
      );
    });

    it("should get/set print flag", () => {
      component.print = true;
      expect(component.print).toBe(true);
      expect(component.target.f & core.AnnotationFlags.print).toBe(
        core.AnnotationFlags.print
      );
    });
  });

  describe("field flags", () => {
    it("should get/set required flag", () => {
      component.required = true;
      expect(component.required).toBe(true);
      expect(
        (component.target.Parent?.ff || 0) & core.FieldFlags.required
      ).toBe(core.FieldFlags.required);
    });

    it("should get/set readOnly flag", () => {
      component.readOnly = true;
      expect(component.readOnly).toBe(true);
      expect(component.target.Parent?.ff || 0 & core.FieldFlags.readOnly).toBe(
        core.FieldFlags.readOnly
      );
    });
  });

  describe("delete", () => {
    it("should remove component from page annotations", () => {
      const page = core.PageObjectDictionary.create(doc.target);
      page.annots = doc.target.createArray(component.target);
      component.target.p = page;

      component.delete();
      expect(page.annots?.length).toBe(0);
    });

    it("should remove component from field kids", () => {
      const field = component.target.Parent;
      expect(field).toBeTruthy();
      const kids = field!.Kids.get();

      component.delete();
      expect(kids.length).toBe(0);
    });
  });
});
