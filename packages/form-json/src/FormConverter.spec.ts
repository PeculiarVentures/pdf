import { PDFDocument } from "@peculiar/pdf-doc";
import { createPdfWithPage, PdfRenderingHelper } from "@peculiar/pdf-tests";
import { DefaultFonts } from "@peculiar/pdf-font";
import { globalFormConverter } from "./registry";

describe("FormConverter", () => {
  let doc: PDFDocument;

  beforeAll(async () => {
    doc = await createPdfWithPage();
    const page = doc.pages.get(0);

    const helveticaFont = doc.addFont(DefaultFonts.Helvetica);

    page.addTextEditor({
      name: "Text1",
      font: helveticaFont,
      top: 5,
      left: 5,
      width: 100,
      height: 20,
      text: "Text1"
    });

    page.addCheckBox({
      name: "CheckBox2",
      top: 30,
      left: 5,
      width: 10,
      height: 10,
      enabled: true
    });

    page.addCheckBox({
      name: "CheckBox3",
      top: 45,
      left: 5,
      width: 10,
      height: 10,
      enabled: true
    });

    page.addRadioButton({
      group: "Group4",
      top: 60,
      left: 5,
      width: 10,
      height: 10,
      value: "Choice1",
      enabled: true
    });

    page.addRadioButton({
      group: "Group4",
      top: 75,
      left: 5,
      width: 10,
      height: 10,
      value: "Choice2"
    });

    page.addComboBox({
      name: "Dropdown5",
      top: 90,
      left: 5,
      width: 100,
      height: 20,
      options: ["option1", "option2", "option3"],
      selected: "option1"
    });
  });

  it("should export data from a PDF document", async () => {
    const json = globalFormConverter.export(doc);

    expect(json).toEqual({
      form: {
        Text1: {
          type: "text_editor",
          id: 7,
          name: "Text1",
          position: {
            top: 5,
            left: 5,
            width: 100,
            height: 20
          },
          flags: {
            hidden: false,
            invisible: false,
            locked: false,
            lockedContents: false,
            noExport: false,
            noRotate: false,
            noView: false,
            noZoom: false,
            print: true,
            readOnly: false,
            readOnlyAnnot: false,
            required: false,
            toggleNoView: false
          },
          maxLen: 0,
          multiline: false,
          text: "Text1"
        },
        CheckBox2: {
          type: "check_box",
          id: 10,
          name: "CheckBox2",
          position: {
            top: 30,
            left: 5,
            width: 10,
            height: 10
          },
          flags: {
            hidden: false,
            invisible: false,
            locked: false,
            lockedContents: false,
            noExport: false,
            noRotate: false,
            noView: false,
            noZoom: false,
            print: true,
            readOnly: false,
            readOnlyAnnot: false,
            required: false,
            toggleNoView: false
          },
          checked: true,
          value: "Yes"
        },
        CheckBox3: {
          type: "check_box",
          id: 13,
          name: "CheckBox3",
          position: {
            top: 45,
            left: 5,
            width: 10,
            height: 10
          },
          flags: {
            hidden: false,
            invisible: false,
            locked: false,
            lockedContents: false,
            noExport: false,
            noRotate: false,
            noView: false,
            noZoom: false,
            print: true,
            readOnly: false,
            readOnlyAnnot: false,
            required: false,
            toggleNoView: false
          },
          checked: true,
          value: "Yes"
        },
        Group4: {
          type: "radio_button_group",
          id: 14,
          name: "Group4",
          selected: "Choice1"
        },
        Dropdown5: {
          type: "combo_box",
          id: 21,
          name: "Dropdown5",
          position: {
            top: 90,
            left: 5,
            width: 100,
            height: 20
          },
          flags: {
            combo: true,
            commitOnSelChange: false,
            doNotSpellCheck: false,
            edit: false,
            hidden: false,
            invisible: false,
            locked: false,
            lockedContents: false,
            multiSelect: false,
            noExport: false,
            noRotate: false,
            noView: false,
            noZoom: false,
            print: true,
            readOnly: false,
            readOnlyAnnot: false,
            required: false,
            sort: false,
            toggleNoView: false
          },
          options: {
            option1: "option1",
            option2: "option2",
            option3: "option3"
          },
          selected: ["option1"]
        }
      }
    });

    const raw = await doc.save();
    const hash = await PdfRenderingHelper.getPageHash(raw, 1);

    const expectedHash: Record<string, string> = {
      darwin:
        "21b6a49b6f63b74cafc33c475ae1757b95ae8965a6d6df65f7d0dc10d33344fa",
      linux: "92cc24f6ccce7a1a19102235aad77341539d7795c0cb250043129e6be49aa525"
    };
    expect(hash).toBe(expectedHash[process.platform]);
  });

  it("should set values", async () => {
    globalFormConverter.setValue(doc, [
      {
        name: "Text1",
        type: "text_editor",
        text: "hello world"
      },
      {
        name: "CheckBox2",
        type: "check_box",
        checked: true
      },
      {
        name: "CheckBox3",
        type: "check_box",
        checked: false
      },
      {
        name: "Group4",
        type: "radio_button_group",
        selected: "Choice2"
      },
      {
        name: "Dropdown5",
        type: "combo_box",
        selected: ["option2"]
      }
    ]);

    const raw = await doc.save();
    const hash = await PdfRenderingHelper.getPageHash(raw, 1);

    const expectedHash: Record<string, string> = {
      darwin:
        "8194df0596ccb08a2710af0bd848eefb8ee1d8fcc6f052519fef685d5d2a08c2",
      linux: "a8db93dbb796d32fd44ea1b30da8f745b7ba6274d6138f8243d169ca087c6386"
    };
    expect(hash).toBe(expectedHash[process.platform]);
  });
});
