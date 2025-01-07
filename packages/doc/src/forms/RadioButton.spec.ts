import { PdfRenderingHelper, xrefTableOptions } from "@peculiar/pdf-tests";
import { PDFDocument, RadioButtonGroup } from "@peculiar/pdf-doc";

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
    const expectedHash: Record<string, string> = {
      darwin:
        "3820eccae341a1ee520d74ac3d0f3800d747f49b5c42c7c6193f959a5459f3bc",
      linux: "f358e0979570f608d36697ce3e7cbf577bfb6fed53dd102f2db93af403b82fcb"
    };
    expect(pageHash).toBe(expectedHash[process.platform]);
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

      const expectedHash: Record<string, string> = {
        darwin:
          "1ac5914eec927e38b8560dba73f6a17a4a05f7b7921ee50a78fad6e07daf86ca",
        linux:
          "e7ca904a422c07b326d3e52bde33e87f00fc4565129972f5e54b6234ccb7307e"
      };
      expect(pageHash).toBe(expectedHash[process.platform]);
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

      const expectedHash: Record<string, string> = {
        darwin:
          "1ac5914eec927e38b8560dba73f6a17a4a05f7b7921ee50a78fad6e07daf86ca",
        linux:
          "e7ca904a422c07b326d3e52bde33e87f00fc4565129972f5e54b6234ccb7307e"
      };
      expect(pageHash).toBe(expectedHash[process.platform]);
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

      const expectedHash: Record<string, string> = {
        darwin:
          "edf66ae9af046066fceba46bba7bb05ad0e751b75f42fabd542781ca007a746a",
        linux:
          "a8213f797a578389a5c147e3a372c9a4f9ae335521da049e09b10c5f0d25157d"
      };
      expect(pageHash).toBe(expectedHash[process.platform]);
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

        const expectedHash: Record<string, string> = {
          darwin:
            "e98d09143c91fa664bf64ab8b089f0bd39981b4b56f387d768d7f4a790d29679",
          linux:
            "1b69b6675c57d1c627b79590224f6971fcec021f1a47490c926ee27aff8af6a7"
        };
        expect(pageHash).toBe(expectedHash[process.platform]);
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

        const expectedHash: Record<string, string> = {
          darwin:
            "f111dca607b76cdf2c66d412e86f209e48244e0ed9e06dea9d3ed4a110e91d97",
          linux:
            "8082e61e16ec4e8be29daaab595fe0b40fa3f6cf3f236e374f6d757e131bcc00"
        };
        expect(pageHash).toBe(expectedHash[process.platform]);
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

      const expectedHash: Record<string, string> = {
        darwin:
          "53d2dc98f4400dab65400d3c351cdbb00be8e48e51c66f92be67b7f8f886cc09",
        linux:
          "62c78641f10870de8e80cbdc74ca007540aa10e22c49e6fddb71e1797f9efc44"
      };
      expect(pageHash).toBe(expectedHash[process.platform]);
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
