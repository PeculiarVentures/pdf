import * as fs from "fs";
import * as path from "path";
import * as core from "@peculiarventures/pdf-core";
import { AnnotationDictionary } from "@peculiarventures/pdf-core";
import { DefaultFonts } from "@peculiarventures/pdf-font";
import { TextAlignment } from ".";
import { PDFDocument, PDFDocumentCreateParameters } from "./Document";
import { PDFVersion } from "./Version";
import { writeFile } from "./Document.spec";
import { FontComponent, TextBlockParams, TextRectangle, TextRow, TextSizeCounter } from "./Font";
import { PDFPage, TextLine } from "./Page";

const options: PDFDocumentCreateParameters = {
  version: PDFVersion.v1_6,
  disableCompressedStreams: true,
  disableCompressedObjects: true,
  useXrefTable: true,
};

// interface TableRow {
//   person: {
//     name: string;
//     email: string;
//   },
//   action: string;
//   date: {
//     date: Date;
//     location: string;
//   };
// }

// interface TableData {
//   left: number;
//   top: number;
//   width: number;
//   headers: [string, string, string];
//   rows: TableRow[];
// }

context("Examples", () => {

  //   it("audit", async () => {
  //     function addLink(rect: TextRectangle, uri: string, page: PDFPage) {
  //       const doc = page.document.target;
  //       const annot = AnnotationDictionary.create(doc.update);

  //       annot.subtype = "Link";
  //       annot.rect.llX = rect.left;
  //       annot.rect.llY = rect.top - rect.height;
  //       annot.rect.urX = rect.left + rect.width;
  //       annot.rect.urY = rect.top;
  //       annot.border = core.PDFRectangle.create(doc.update);

  //       // annot.f = core.AnnotationFlags.print;
  //       annot.set("A", doc.createDictionary(
  //         ["S", doc.createName("URI")],
  //         ["URI", doc.createString(uri)],
  //       ).makeIndirect());

  //       page.target.addAnnot(annot);

  //       return annot;
  //     }

  //     console.time("PDF creation");
  //     const doc = await PDFDocument.create(options);

  //     const template = {
  //       transactionId: "{transactionId}",
  //       fileName: "{fileName}",
  //       createdAt: new Date(),
  //       createdBy: "{createBy}",
  //       status: "{status}",
  //       tableData: [
  //         {
  //           person: {
  //             name: "Stepan Miroshin",
  //             email: "microshine@peculiar.com",
  //           },
  //           action: "Uploaded the file [Hurst Gutter proposal.pdf](https://yandex.ru)",
  //           date: {
  //             date: new Date(),
  //             location: "50.54.143.97, Chrome on Mac OS"
  //           }
  //         },
  //         {
  //           person: {
  //             name: "Stepan Miroshin",
  //             email: "microshine@peculiar.com",
  //           },
  //           action: "Created the transaction",
  //           date: {
  //             date: new Date(),
  //             location: "50.54.143.97, Chrome on Mac OS"
  //           }
  //         },
  //         {
  //           person: {
  //             name: "Stepan Miroshin",
  //             email: "microshine@peculiar.com",
  //           },
  //           action: "Added, removed or modified a field(s) in file [Hurst Gutter proposal.pdf](https://yandex.ru) 3 times",
  //           date: {
  //             date: new Date(),
  //             location: "50.54.143.97, Chrome on Mac OS"
  //           }
  //         },
  //         {
  //           person: {
  //             name: "Stepan Miroshin",
  //             email: "microshine@peculiar.com",
  //           },
  //           action: "Consented to the use of electronic signatures, and agreed to both the [terms of service](https://yandex.ru) and the [privacy policy](https://yandex.ru) when signing file [Hurst Gutter proposal.pdf](https://yandex.ru)",
  //           date: {
  //             date: new Date(),
  //             location: "50.54.143.97, Chrome on Mac OS"
  //           }
  //         },
  //       ]
  //     };

  //     /**
  //      * /Catalog /Resources /Font /Helv /Zd
  //      * /Page /Resources /Font /Helv
  //      * /Page /Resources /Font /Helv
  //      *
  //      * /Font
  //      */

  //     const themeColor: core.Colors = [0x66 / 0xff, 0xb2 / 0xff, 0xff / 0xff];
  //     const grayColor: core.Colors = 0.56;
  //     const padding = 40;
  //     const leftPadding = padding;
  //     const rightPadding = padding;
  //     const topPadding = 20;
  //     const bottomPadding = padding;

  //     const page = doc.pages.create();

  //     const font = doc.addFont();
  //     const fontBold = doc.addFont(DefaultFonts.HelveticaBold);

  //     page.drawText({
  //       text: `Transaction ID: ${template.transactionId}`,
  //       font,
  //       fontSize: 9,
  //       color: grayColor,
  //       baseLine: TextLine.ascent,
  //       left: leftPadding,
  //       top: topPadding,
  //     });

  //     page.drawText({
  //       text: template.fileName,
  //       font: fontBold,
  //       fontSize: 16,
  //       left: leftPadding,
  //       top: topPadding + 65,
  //     });
  //     page.drawText({
  //       text: "Audit History",
  //       font,
  //       fontSize: 13,
  //       color: grayColor,
  //       left: leftPadding,
  //       top: topPadding + 84,
  //     });

  //     function drawProperty(name: string, value: string, top: number) {
  //       page.drawText({
  //         text: name,
  //         font,
  //         fontSize: 9,
  //         color: grayColor,
  //         left: leftPadding,
  //         top,
  //       });
  //       page.drawText({
  //         text: value,
  //         font,
  //         fontSize: 9,
  //         left: leftPadding + 60,
  //         top,
  //       });
  //     }

  //     let propertiesTop = topPadding + 113;
  //     drawProperty("Crated at:", template.createdAt.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }), propertiesTop);
  //     propertiesTop += 15;
  //     drawProperty("By:", template.createdBy, propertiesTop);
  //     propertiesTop += 15;
  //     drawProperty("Status:", template.status, propertiesTop);

  //     page.drawText({
  //       text: "Details",
  //       font,
  //       fontSize: 13,
  //       color: grayColor,
  //       left: leftPadding,
  //       top: topPadding + 212,
  //     });

  //     function drawTable(data: TableData, content: core.PDFContent) {
  //       content.graphicsBegin();

  //       function drawHLine(top: number) {
  //         content
  //           .setColor(0.9, true)
  //           .setLineWidth(1)
  //           .moveTo(data.left, top)
  //           .lineTo(data.left + data.width, top)
  //           .stroke();
  //       }

  //       function drawVLine(left: number, begin: number, end: number) {
  //         content
  //           .setColor(0.9, true)
  //           .setLineWidth(1)
  //           .moveTo(left, begin)
  //           .lineTo(left, end)
  //           .stroke();
  //       }

  //       const tableBegin = data.top;
  //       let tableEnd = data.top;
  //       const tablePadding = 10;
  //       const colWidth1 = 155;
  //       const colWidth3 = 155;
  //       const colWidth2 = data.width - colWidth1 - colWidth3;

  //       const headerFontSize = 9;

  //       // header
  //       drawHLine(tableBegin);
  //       tableEnd -= tablePadding;
  //       tableEnd -= fontBold.fontInfo.ascent * headerFontSize / fontBold.fontInfo.unitsPerEm;
  //       content
  //         .textBegin()
  //         .setColor(0)
  //         .textFont(fontBold.name, headerFontSize)
  //         .textMove(data.left + tablePadding, tableEnd)
  //         .textShow(data.headers[0])
  //         .textEnd()
  //         .textBegin()
  //         .setColor(0)
  //         .textFont(fontBold.name, headerFontSize)
  //         .textMove(data.left + tablePadding + colWidth1, tableEnd)
  //         .textShow(data.headers[1])
  //         .textEnd()
  //         .textBegin()
  //         .setColor(0)
  //         .textFont(fontBold.name, headerFontSize)
  //         .textMove(data.left + tablePadding + colWidth1 + colWidth2, tableEnd)
  //         .textShow(data.headers[2])
  //         .textEnd();
  //       drawHLine(tableBegin);

  //       tableEnd -= Math.abs(fontBold.fontInfo.descent) * headerFontSize / fontBold.fontInfo.unitsPerEm;
  //       tableEnd -= tablePadding;
  //       drawHLine(tableEnd);

  //       function prepareActionText(text: string) {
  //         const blocks: TextBlockParams[] = [];

  //         const reg = /\[([^\]]+)\]\(([^)]+)\)/gm;
  //         let offset = 0;
  //         let matches: RegExpExecArray | null = null;
  //         // eslint-disable-next-line no-cond-assign
  //         while (matches = reg.exec(text)) {
  //           const subtext = text.substring(offset, matches.index);
  //           offset = matches.index + matches[0].length;

  //           blocks.push({
  //             font,
  //             text: subtext,
  //             style: {
  //               color: 0,
  //               size: 9,
  //             }
  //           });
  //           blocks.push({
  //             font,
  //             text: matches[1],
  //             link: matches[2],
  //             style: {
  //               color: [6 / 255, 69 / 255, 173 / 255], // blue
  //               size: 9,
  //             }
  //           });
  //         }

  //         if (!blocks.length) {
  //           blocks.push({
  //             font,
  //             text,
  //             style: {
  //               color: 0,
  //               size: 9,
  //             }
  //           });
  //         }

  //         return blocks;
  //       }

  //       // Row
  //       for (const row of data.rows) {
  //         tableEnd -= tablePadding;

  //         // Person
  //         content.textBegin()
  //           // Name
  //           .setColor(0)
  //           .textFont(font.name, 9)
  //           .textMove(data.left + tablePadding, tableEnd - font.fontInfo.ascent * 9 / font.fontInfo.unitsPerEm)
  //           .textShow(row.person.name)
  //           .textLeading(9)
  //           .textNextLine()
  //           // Email
  //           .setColor(grayColor)
  //           .textFont(font.name, 7)
  //           .textShow(row.person.email)
  //           .textEnd();

  //         // Action

  //         const actionText = prepareActionText(row.action);
  //         const actionSize = TextSizeCounter.calculate({
  //           width: colWidth2 - (tablePadding * 2),
  //           blocks: actionText,
  //         });
  //         actionSize.left = data.left + tablePadding + colWidth1;
  //         actionSize.top = tableEnd;

  //         content.textBegin()
  //           .textMove(actionSize.left, actionSize.top - actionSize.rows[0].ascent);
  //         let lastRow: TextRow | null = null;
  //         for (const actionRow of actionSize.rows) {
  //           if (lastRow) {
  //             const leading = actionRow.ascent - lastRow.descent;
  //             content
  //               .textLeading(leading)
  //               .textNextLine();
  //           }
  //           lastRow = actionRow;
  //           for (const actionItem of actionRow.items) {
  //             content
  //               .setColor(actionItem.original.style.color)
  //               .textFont(font.name, actionItem.original.style.size)
  //               .textShow(actionItem.text);

  //             if (actionItem.original.link) {
  //               addLink(new TextRectangle(
  //                 actionSize.left + actionRow.left + actionItem.left,
  //                 actionSize.top - actionRow.top - actionItem.top,
  //                 actionItem.width,
  //                 actionItem.height
  //               ), actionItem.original.link, page);
  //             }
  //           }
  //         }
  //         content.textEnd();

  //         // Date/Location
  //         content.textBegin()
  //           // Name
  //           .setColor(0)
  //           .textFont(font.name, 9)
  //           .textMove(data.left + tablePadding + colWidth1 + colWidth2, tableEnd - font.fontInfo.ascent * 9 / font.fontInfo.unitsPerEm)
  //           .textShow(row.date.date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }))
  //           .textNextLine()
  //           .textLeading(9)
  //           // Email
  //           .setColor(grayColor)
  //           .textFont(font.name, 7)
  //           .textShow(row.date.location)
  //           .textEnd();

  //         tableEnd -= actionSize.height < 18 ? 18 : actionSize.height;

  //         tableEnd -= tablePadding;
  //         drawHLine(tableEnd);
  //       }

  //       drawVLine(data.left, tableBegin, tableEnd);
  //       drawVLine(data.left + colWidth1, tableBegin, tableEnd);
  //       drawVLine(data.left + colWidth1 + colWidth2, tableBegin, tableEnd);
  //       drawVLine(data.left + data.width, tableBegin, tableEnd);

  //       content.graphicsEnd();
  //     }

  //     const pageContent = (page.target.contents as core.PDFArray).get(0) as core.PDFStream;
  //     const content = new core.PDFContent();

  //     drawTable({
  //       left: leftPadding,
  //       top: page.height - topPadding - 225,
  //       width: page.width - leftPadding - rightPadding,
  //       headers: [
  //         "Person",
  //         "Action",
  //         "Date/Location",
  //       ],
  //       rows: template.tableData,
  //     }, content);

  //     const contentWriter = new core.ViewWriter();
  //     contentWriter.writeLine(pageContent.stream);
  //     contentWriter.writeLine(content.toUint8Array());

  //     pageContent.stream = contentWriter.toUint8Array();

  //     const pdf = await doc.save();

  //     console.timeEnd("PDF creation");

  //     writeFile(pdf);

  //   });

  //   it("draw custom text block", async () => {
  //     const doc = await PDFDocument.create(options);

  //     const template = {
  //     };

  //     const themeColor: core.Colors = [0x66 / 0xff, 0xb2 / 0xff, 0xff / 0xff];
  //     const padding = 20;
  //     const leftPadding = padding;
  //     const rightPadding = padding;
  //     const topPadding = padding;
  //     const bottomPadding = padding;

  //     const page = doc.pages.create();

  //     // TODO Add font to resources from addFont
  //     const font = doc.addFont(DefaultFonts.Helvetica);

  //     const fontBold = doc.addFont(DefaultFonts.CourierBold);

  //     const width = core.TypographyConverter.toPoint("75px");
  //     const textBlock = TextSizeCounter.calculate({
  //       width,
  //       blocks: [
  //         {
  //           text: "abcde\nabc a-------------------------------bcdksjdksjdskdjskjdskj ab a 12 ",
  //           font: fontBold,
  //           style: {
  //             size: 12,
  //           }
  //         },
  //         {
  //           text: "abcde abcd abc a? ! 12 ",
  //           font: fontBold,
  //           style: {
  //             size: 12,
  //           }
  //         },
  //         {
  //           text: "abcdefghijk abcd abc ab a 24 ",
  //           font: font,
  //           style: {
  //             size: 24,
  //           }
  //         },
  //         {
  //           text: "abcde abcd abc ab a 12 ",
  //           font: fontBold,
  //           style: {
  //             size: 12,
  //           }
  //         },
  //         {
  //           text: "abcde abcd abc ab a 16",
  //           font: font,
  //           style: {
  //             size: 16,
  //           }
  //         },
  //         {
  //           text: "-----------------------------------------------------------",
  //           font: fontBold,
  //           style: {
  //             size: 12,
  //           }
  //         },
  //       ]
  //     });

  //     textBlock.left = leftPadding;
  //     textBlock.top = page.height - padding;

  //     const content = new core.PDFContent();
  //     content.graphicsBegin()
  //       .setColor([0.5, 1, 1])
  //       .drawRectangle(textBlock.left, textBlock.top, width, textBlock.height)
  //       .fill()
  //       // .clip()
  //       // .end()
  //       .textBegin()
  //       .textMove(textBlock.left, textBlock.top - textBlock.rows[0].ascent);

  //     let f = true;
  //     let lastRow: TextRow | null = null;
  //     for (const row of textBlock.rows) {
  //       if (lastRow) {
  //         const leading = row.ascent - lastRow.descent;
  //         content
  //           .textLeading(leading)
  //           .textNextLine();
  //       }
  //       lastRow = row;

  //       for (const item of row.items) {
  //         content
  //           .setColor(f ? 0.7 : 0.8)
  //           .drawRectangle(textBlock.left + row.left + item.left, textBlock.top - row.top - item.top, item.width, item.height)
  //           .fill()
  //           .setColor(item.original.style.color)
  //           .textFont(item.original.font.fontInfo.name.postScriptName, item.original.style.size)
  //           .textShow(item.text);
  //         f = !f;
  //       }
  //     }

  //     content.textEnd()
  //       .graphicsEnd();

  //     for (const row of textBlock.rows) {
  //       const y = textBlock.top - row.top - row.ascent;
  //       content
  //         .setColor(0.5, true)
  //         .setLineWidth(0.5)
  //         .moveTo(textBlock.left, y)
  //         .lineTo(textBlock.left + row.width, y)
  //         .stroke();
  //     }

  //     page.target.contents = doc.target.createStream(content.toUint8Array());

  //     const pdf = await doc.save();
  //     writeFile(pdf);
  //   });

  it("Invoice", async () => {
    const doc = await PDFDocument.create(options);

    const template = {
      invoiceNumber: "{invoiceNumber}",
      companyName: "{companyName}",
      companyAddress: "{companyAddress}",
      companyEmail: "{companyEmail}",
      companyPhoneNumber: "{companyPhoneNumber}",
      myProductsTotal: "{myProducts:total}",
      table: {
        items: [
          ["Milk 1 L", "$7.95"],
          ["Orvital Organic Medium Egg (53-62 G)", "$18.95"],
          ["Bread 400 Gr.", "$3.95"],
          ["Книжка", "$2.95"],
        ],
        bonus: [
          ["Subtotal", "$89.25"],
          ["Shipping", "$5"],
        ],
        total: "$94.25"
      }
    };

    const themeColor: core.Colors = [0x66 / 0xff, 0xb2 / 0xff, 0xff / 0xff];
    const grayColor: core.Colors = 0.5;
    const blackColor: core.Colors = 0;
    const whiteColor: core.Colors = 1;
    const padding = 43;
    const leftSide = padding;
    console.time("add fonts");

    // const fontHelv = doc.addFont(fs.readFileSync(path.join(__dirname, "..", "..", "font", "fonts", "Helvetica.ttf")));
    // const fontHelvBold = doc.addFont(fs.readFileSync(path.join(__dirname, "..", "..", "font", "fonts", "HelveticaBold.ttf")));
    // const fontHelvBoldOblique = doc.addFont(fs.readFileSync(path.join(__dirname, "..", "..", "font", "fonts", "HelveticaBoldOblique.ttf")));
    const fontHelv = doc.addFont(DefaultFonts.Helvetica);
    const fontHelvBold = doc.addFont(DefaultFonts.HelveticaBold);
    const fontHelvBoldOblique = doc.addFont(DefaultFonts.HelveticaBoldOblique);
    console.timeEnd("add fonts");

    const page = doc.pages.create();
    const mediaWidth = page.width - padding * 2;

    page.graphics()
      .fillColor(themeColor)
      .rect(0, 0, page.width, 70)
      .fill();

    const rightSide = page.width - padding;

    page.graphics()
      .strokeColor(themeColor)
      .lineWidth(1)
      .line(leftSide, 167, rightSide, 167)
      .stroke();

    page.text()
      .color(whiteColor)
      .font(fontHelv, 18)
      .move(leftSide, 44)
      .show("INVOICE");

    const graphics = page.graphics();
    graphics.drawText({
      width: mediaWidth,
      align: TextAlignment.right,
      blocks: [
        {
          text: template.invoiceNumber,
          font: fontHelvBold,
          style: {
            color: whiteColor,
            size: 18,
          }
        }
      ]
    }, leftSide, 44);

    graphics
      .drawText({
        width: mediaWidth,
        blocks: [
          {
            text: "ACME",
            font: fontHelvBoldOblique,
            style: {
              color: themeColor,
              size: 42,
            }
          }
        ]
      }, leftSide, 97);

    graphics
      .drawText({
        width: mediaWidth,
        align: TextAlignment.right,
        blocks: [
          {
            text: template.companyName,
            font: fontHelvBold,
            style: {
              color: blackColor,
              size: 12,
            }
          }
        ]
      }, leftSide, 86);

    graphics
      .drawText({
        width: mediaWidth,
        align: TextAlignment.right,
        leading: 1.2,
        blocks: [
          {
            text: `${template.companyAddress}\n${template.companyEmail}\n${template.companyPhoneNumber}`,
            font: fontHelv,
            style: {
              color: grayColor,
              size: 10,
            }
          }
        ]
      }, leftSide, 110);

    graphics
      .drawText({
        width: mediaWidth,
        align: TextAlignment.right,
        blocks: [
          {
            text: "TOTAL",
            font: fontHelvBold,
            style: {
              color: themeColor,
              size: 12,
            }
          }
        ]
      }, leftSide, 186);

    graphics
      .drawText({
        width: mediaWidth,
        align: TextAlignment.right,
        blocks: [
          {
            text: template.myProductsTotal,
            font: fontHelvBold,
            style: {
              color: blackColor,
              size: 24,
            }
          }
        ]
      }, leftSide, 214);

    graphics
      .drawText({
        width: mediaWidth,
        align: TextAlignment.right,
        blocks: [
          {
            text: "Received: ",
            font: fontHelvBold,
            style: {
              color: blackColor,
              size: 12,
            }
          },
          {
            text: new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
            font: fontHelv,
            style: {
              color: grayColor,
              size: 12,
            }
          }
        ]
      }, leftSide, 264);

    let currentTop = 292;

    // Draw table
    console.time("draw table");
    if (template.table && template.table.items.length) {
      const tableGraphics = page.graphics();

      const tableLeft = leftSide;
      const tableWidth = mediaWidth;
      const tableRowHeight = 30;
      const fontSize = 12;
      const cellPadding = (tableRowHeight - fontSize) / 2;
      const columnWidth1 = 400;
      const columnWidth2 = tableWidth - columnWidth1;
      const textStyle = {
        size: fontSize,
        color: blackColor,
      };
      const totalPadding = 200;

      // Draw table header
      tableGraphics
        .fillColor(themeColor)
        .rect(tableLeft, currentTop, tableWidth, tableRowHeight)
        .fill();

      tableGraphics.drawText({
        width: columnWidth1 - cellPadding * 2,
        blocks: [
          {
            text: "Description",
            font: fontHelvBold,
            style: textStyle,
          }
        ]
      }, tableLeft + cellPadding, currentTop + cellPadding);
      tableGraphics.drawText({
        width: columnWidth2 - cellPadding * 2,
        align: TextAlignment.right,
        blocks: [
          {
            text: "Amount",
            font: fontHelvBold,
            style: textStyle,
          }
        ]
      }, tableLeft + columnWidth1 + cellPadding, currentTop + cellPadding);

      currentTop += tableRowHeight;

      for (const [description, amount] of template.table.items) {
        // Draw rows
        tableGraphics.drawText({
          width: columnWidth1 - cellPadding * 2,
          blocks: [
            {
              text: description,
              font: fontHelvBold,
              style: textStyle,
            }
          ]
        }, tableLeft + cellPadding, currentTop + cellPadding);
        tableGraphics.drawText({
          width: columnWidth2 - cellPadding * 2,
          align: TextAlignment.right,
          blocks: [
            {
              text: amount,
              font: fontHelv,
              style: textStyle,
            }
          ]
        }, tableLeft + columnWidth1 + cellPadding, currentTop + cellPadding);

        currentTop += tableRowHeight;

        tableGraphics
          .strokeColor(grayColor)
          .line(tableLeft, currentTop, tableLeft + tableWidth, currentTop)
          .stroke();

      }

      const bonusRowHeight = 11;
      currentTop += cellPadding;

      for (const [description, amount] of template.table.bonus) {
        // Draw rows
        tableGraphics.drawText({
          width: columnWidth1 - cellPadding * 2 - totalPadding,
          blocks: [
            {
              text: description,
              font: fontHelv,
              style: textStyle,
            }
          ]
        }, tableLeft + cellPadding + totalPadding, currentTop);
        tableGraphics.drawText({
          width: columnWidth2 - cellPadding * 2,
          align: TextAlignment.right,
          blocks: [
            {
              text: amount,
              font: fontHelv,
              style: textStyle,
            }
          ]
        }, tableLeft + columnWidth1 + cellPadding, currentTop);


        currentTop += bonusRowHeight;
      }

      currentTop += cellPadding;
      tableGraphics
        .strokeColor(grayColor)
        .line(tableLeft + totalPadding, currentTop, tableLeft + tableWidth, currentTop)
        .stroke();

      // Total
      currentTop += cellPadding;

      tableGraphics.drawText({
        width: columnWidth1 - cellPadding * 2 - totalPadding,
        blocks: [
          {
            text: "Total",
            font: fontHelv,
            style: textStyle,
          }
        ]
      }, tableLeft + cellPadding + totalPadding, currentTop);
      tableGraphics.drawText({
        width: columnWidth2 - cellPadding * 2,
        align: TextAlignment.right,
        blocks: [
          {
            text: template.table.total,
            font: fontHelvBold,
            style: {
              size: 17,
              color: blackColor,
            },
          }
        ]
      }, tableLeft + columnWidth1 + cellPadding, currentTop);

      currentTop += cellPadding;
    }
    console.timeEnd("draw table");

    const thankYouTop = currentTop + 80;
    graphics
      .strokeColor(themeColor)
      .lineWidth(4)
      .line(leftSide, thankYouTop, leftSide + 80, thankYouTop)
      .stroke();

    graphics
      .drawText({
        width: mediaWidth,
        blocks: [
          {
            text: "THANK YOU",
            font: fontHelvBold,
            style: {
              size: 12,
              color: blackColor
            }
          }
        ]
      }, leftSide, thankYouTop + 10);

    console.time("serialize pdf");
    const pdf = await doc.save();
    console.timeEnd("serialize pdf");
    writeFile(pdf);
  });


});
