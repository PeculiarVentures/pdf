import {
  PdfRenderingHelper,
  xrefTableOptions
} from "@peculiarventures/pdf-tests";
import { PDFDocument, RadioButtonGroup } from "@peculiarventures/pdf-doc";

describe("RadioButton", () => {
  let docRaw: ArrayBuffer;

  beforeAll(async () => {
    const doc = await PDFDocument.create(xrefTableOptions);
    const page = doc.pages.create();

    // Create two radio buttons in the same group
    page.addRadioButton({
      left: 10,
      top: 10,
      width: 20,
      height: 20,
      borderColor: [0, 0, 0],
      borderWidth: 1,
      group: "radioGroup1",
      value: "Option1",
      enabled: false
    });

    page.addRadioButton({
      left: 10,
      top: 40,
      width: 20,
      height: 20,
      borderColor: [0, 0, 0],
      borderWidth: 1,
      group: "radioGroup1",
      value: "Option2",
      enabled: false
    });

    docRaw = await doc.save();
  });

  it("draw", async () => {
    const pageHash = await PdfRenderingHelper.getPageHash(docRaw, 1);
    expect(pageHash).toBe(
      "3820eccae341a1ee520d74ac3d0f3800d747f49b5c42c7c6193f959a5459f3bc"
    );
  });

  describe("change value", () => {
    it("use group selected", async () => {
      const doc = await PDFDocument.load(docRaw);
      const radioGroup = doc.getComponentByName(
        "radioGroup1",
        RadioButtonGroup
      );
      const radioBtn1 = radioGroup.get("Option1");
      const radioBtn2 = radioGroup.get("Option2");

      expect(radioGroup.selected).toBe(null); // No selected value

      // Check current state
      expect(radioBtn1.checked).toBe(false);
      expect(radioBtn2.checked).toBe(false);

      radioGroup.selected = "Option1";
      expect(radioGroup.selected).toBe("Option1");

      // Check new state
      expect(radioBtn1.checked).toBe(true);
      expect(radioBtn2.checked).toBe(false);

      const pdf = await doc.save();
      const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);
      expect(pageHash).toBe(
        "1ac5914eec927e38b8560dba73f6a17a4a05f7b7921ee50a78fad6e07daf86ca"
      );
    });

    it("change radio button value", async () => {
      const doc = await PDFDocument.load(docRaw);
      const radioGroup = doc.getComponentByName(
        "radioGroup1",
        RadioButtonGroup
      );
      const radioBtn1 = radioGroup.get("Option1");
      radioBtn1.checked = true;

      const pdf = await doc.save();
      const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);
      expect(pageHash).toBe(
        "1ac5914eec927e38b8560dba73f6a17a4a05f7b7921ee50a78fad6e07daf86ca"
      );
    });
  });

  describe("RadioButtonGroup", () => {
    it("get group by name", async () => {
      const doc = await PDFDocument.load(docRaw);
      const group = doc.getComponentByName("radioGroup1", RadioButtonGroup);

      expect(group).toBeDefined();
      expect(group.length).toBe(2);
    });
  });

  describe("style", () => {
    it("change colors", async () => {
      const doc = await PDFDocument.load(docRaw);
      const radioGroup = doc.getComponentByName(
        "radioGroup1",
        RadioButtonGroup
      );
      const radioBtn = radioGroup.get("Option1");

      radioBtn.borderColor = [1, 0, 0];
      radioBtn.backgroundColor = [0, 1, 0];
      radioBtn.foreColor = [0, 0, 1];
      radioBtn.checked = true;

      const pdf = await doc.save();
      const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);
      expect(pageHash).toBe(
        "edf66ae9af046066fceba46bba7bb05ad0e751b75f42fabd542781ca007a746a"
      );
    });

    describe("border", () => {
      it("no border", async () => {
        const doc = await PDFDocument.load(docRaw);
        const radioGroup = doc.getComponentByName(
          "radioGroup1",
          RadioButtonGroup
        );
        const radioBtn = radioGroup.get("Option1");
        radioBtn.borderWidth = 0;

        const pdf = await doc.save();
        const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);
        expect(pageHash).toBe(
          "e98d09143c91fa664bf64ab8b089f0bd39981b4b56f387d768d7f4a790d29679"
        );
      });

      it("change border width", async () => {
        const doc = await PDFDocument.load(docRaw);
        const radioGroup = doc.getComponentByName(
          "radioGroup1",
          RadioButtonGroup
        );
        const radioBtn = radioGroup.get("Option1");

        radioBtn.borderWidth = 5;

        const pdf = await doc.save();
        const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);
        expect(pageHash).toBe(
          "f111dca607b76cdf2c66d412e86f209e48244e0ed9e06dea9d3ed4a110e91d97"
        );
      });
    });
  });

  describe("transform", () => {
    it("position", async () => {
      const doc = await PDFDocument.load(docRaw);
      const radioGroup = doc.getComponentByName(
        "radioGroup1",
        RadioButtonGroup
      );
      const radioBtn = radioGroup.get("Option1");

      radioBtn.left += 100;
      radioBtn.top += 100;

      const pdf = await doc.save();
      const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);
      expect(pageHash).toBe(
        "53d2dc98f4400dab65400d3c351cdbb00be8e48e51c66f92be67b7f8f886cc09"
      );
    });

    it("size", async () => {
      const doc = await PDFDocument.load(docRaw);
      const radioGroup = doc.getComponentByName(
        "radioGroup1",
        RadioButtonGroup
      );
      const radioBtn = radioGroup.get("Option1");

      radioBtn.width += 20;
      radioBtn.height += 20;
      radioBtn.checked = true;

      const pdf = await doc.save();
      const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);
      expect(pageHash).toBeTruthy();
    });
  });
});
