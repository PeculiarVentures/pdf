import { PDFStream } from "./Stream";
import "./register";

describe("Stream", () => {
  describe("fromPDF", () => {
    const vector: [string, number][] = [
      [
        `<</Length 0>>stream
endstream`,
        0
      ],
      [
        `<</Length 1>>stream
1
endstream`,
        1
      ],
      [
        `<</Length 1>>
stream
1
endstream`,
        1
      ],
      [
        `<</Length 5>>
stream
12345
endstream`,
        5
      ],
      [
        `<</Length 10>>
stream
12345
endstream`,
        5
      ],
      [
        `<</Length 1>>
stream
12345
endstream`,
        5
      ]
    ];
    vector.forEach(([i, o]) => {
      it(JSON.stringify(i), () => {
        const parsedItem = PDFStream.fromPDF(i);
        expect(parsedItem.stream.length).toBe(o);
      });
    });
  });

  describe("toPDF", () => {
    const vector: [Uint8Array, string][] = [
      [
        Buffer.from("sd"),
        `<<
/Length 2
>>
stream
sd
endstream`
      ]
    ];
    vector.forEach(([i, o]) => {
      it(i.toString(), () => {
        const parsedItem = new PDFStream(i);
        const view = parsedItem.toPDF();
        expect(Buffer.from(view).toString()).toBe(o);
      });
    });
  });

  // describe("Filters", () => {
  //   it("create/decode", async () => {
  //     const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
  //     const stream = await pdf.Stream.createAsync(data, [new pdf.ASCIIHexFilter(), new pdf.ASCIIHexFilter()], {
  //       Width: new pdf.Numeric({ value: 20 }),
  //     });

  //     const outStream = new ByteStream();
  //     stream.toPDF(outStream);

  //     const parsedStream = new pdf.Stream();
  //     parsedStream.fromPDF(outStream);
  //     const decodedStream = await parsedStream.decode();
  //     expect(new Uint8Array(decodedStream).toString()).toBe(data.toString());
  //   });
  //   it("Flate", async () => {
  //     assert.strictEqual(new Uint8Array(decodedStream).toString(), data.toString());
  //   });
  //   it("Flate", async () => {
  //     const data = Buffer.from(`3c3c202f4e2033202f416c7465726e617465202f446576696365524742202f4c656e6774682032363132202f46696c746572202f466c6174654465636f6465203e3e0a73747265616d0a78019d96775453d91687cfbd37bdd012222025f41a7a0920d23b48150451894980500286842676440546141129566454c0014787226345140b838262d709f21050c6c1514445e5dd8c6b09efad35f3de9afdc759dfd9e7b7d7d967ef7dd7ba0050fc8204c27458018034a15814eeebc15c1213cbc4f7021810010e5801c0e166660447f84402d4fcbd3d9999a848c6b3f6ee2e8064bbdb2cbf502673d6ff7f912237432406000a45d5363c7e2617e5029453b3c51932ff04caf495293286313216a109a2ac22e3c4af6cf6a7e62bbbc9989726e4a11a59ce19bc349e8cbb50de9a25e1a38c04a15c9825e067a37c0765bd54499a00e5f728d3d3f89c4c003014995fcce726a16c8932451419ee89f202000894c439bc720e8bf939689e0078a667e48a04894962a611d79869e5e8c866faf1b353f962312b94c34de188784ccff4b40c8e301780af6f96450125596d996891edad1ceded59d6e668f9bfd9df1e7e53fd3dc87afb55f126eccf9e418c9e59df6cecac2fbd1600f6245a9b1db3be955500b46d0640e5e1ac4fef2000f20500b4de9cf31e866c5e92c4e20c270b8becec6c73019f6b2e2be837fb9f826fcabf8639f799cbeefb563ba6173f81234915336545e5a6a7a64b44cccc0c0e97cf64fdf710ffe3c03969cdc9c32c9c9fc017f185e85551e89409848968bb853c8158902e640a847fd5e17f18362707197e9d6b1468755f007d853950b84907c86f3d00432303246e3f7a027deb5b10310ac8bebc68ad91af738f327afee7fa1f0b5c8a6ee14c412253e6f60c8f647225a22c19a3df846cc10212900774a00a34812e30022c600d1c80337003de2000848048100396032e4802694004b2413ed8000a4131d80176836a7000d4817ad0044e823670065c0457c00d700b0c8047400a86c14b3001de81690882f01015a241aa9016a40f9942d6101b5a0879434150381403c5438990109240f9d026a8182a83aaa143503df423741aba085d83faa007d0203406fd017d84119802d3610dd800b680d9b03b1c0847c2cbe04478159c0717c0dbe14ab8163e0eb7c217e11bf0002c855fc2930840c80803d14658081bf144429058240111216b9122a402a9459a900ea41bb98d489171e4030687a161981816c619e387598ce1625661d6624a30d5986398564c17e63666103381f982a562d5b1a65827ac3f760936119b8d2dc456608f605bb097b103d861ec3b1c0ec7c019e21c707eb8185c326e35ae04b70fd78cbb80ebc30de126f178bc2ade14ef820fc173f0627c21be0a7f1c7f1edf8f1fc6bf2790095a046b820f219620246c2454101a08e708fd8411c2345181a84f7422861079c45c6229b18ed841bc491c264e93144986241752242999b48154496a225d263d26bd2193c93a6447721859405e4fae249f205f250f923f50942826144f4a1c4542d94e394ab94079407943a5520da86ed458aa98ba9d5a4fbd447d4a7d2f47933397f397e3c9ad93ab916b95eb977b254f94d79777975f2e9f275f217f4afea6fcb80251c140c15381a3b056a146e1b4c23d8549459aa2956288629a62896283e235c55125bc928192b7124fa940e9b0d225a5211a42d3a579d2b8b44db43ada65da301d4737a4fbd393e9c5f41fe8bdf4096525655be528e51ce51ae5b3ca5206c23060f8335219a58c938cbb8c8ff334e6b9cfe3cfdb36af695effbc2995f92a6e2a7c952295669501958faa4c556fd514d59daa6daa4fd4306a266a616ad96afbd52eab8dcfa7cf779ecf9d5f34ffe4fc87eab0ba897ab8fa6af5c3ea3dea931a9a1abe1a191a551a9734c635199a6e9ac99ae59ae734c7b4685a0bb5045ae55ae7b55e309599eecc546625b38b39a1adaeeda72dd13ea4ddab3dad63a8b35867a34eb3ce135d922e5b3741b75cb75377424f4b2f582f5faf51efa13e519fad9fa4bf47bf5b7fcac0d020da608b419bc1a8a18aa1bf619e61a3e16323aa91abd12aa35aa33bc63863b6718af13ee35b26b0899d4992498dc94d53d8d4de5460bacfb4cf0c6be6682634ab35bbc7a2b0dc5959ac46d6a039c33cc87ca3799bf92b0b3d8b588b9d16dd165f2ced2c532deb2c1f59295905586db4eab0fac3dac49a6b5d637dc7866ae363b3cea6dde6b5ada92ddf76bfed7d3b9a5db0dd16bb4ebbcff60ef622fb26fb31073d877887bd0ef7d8747628bb847dd511ebe8e1b8cef18ce307277b27b1d349a7df9d59ce29ce0dcea30b0c17f017d42d1872d171e1b81c72912e642e8c5f7870a1d455db95e35aebfacc4dd78de776c46dc4ddd83dd9fdb8fb2b0f4b0f91478bc794a793e71acf0b5e8897af579157afb792f762ef6aefa73e3a3e893e8d3e13be76beab7d2ff861fd02fd76faddf3d7f0e7fad7fb4f043804ac09e80aa404460456073e0b320912057504c3c101c1bb821f2fd25f245cd4160242fc4376853c09350c5d15fa73182e2c34ac26ec79b855787e7877042d62454443c4bb488fc8d2c8478b8d164b167746c947c545d5474d457b4597454b97582c59b3e4468c5a8c20a63d161f1b157b247672a9f7d2dd4b87e3ece20ae3ee2e335c96b3ecda72b5e5a9cbcfae905fc159712a1e1b1f1ddf10ff8913c2a9e54caef45fb977e504d793bb87fb92e7c62be78df15df865fc91049784b284d14497c45d896349ae491549e3024f41b5e075b25ff281e4a9949094a32933a9d1a9cd6984b4f8b4d34225618ab02b5d333d27bd2fc334a33043baca69d5ee5513a240d1914c28735966bb988efe4cf5488c249b2583590bb36ab2de6747659fca51cc11e6f4e49ae46ecb1dc9f3c9fb7e356635777567be76fe86fcc135ee6b0ead85d6ae5cdbb94e775dc1bae1f5beeb8f6d206d48d9f0cb46cb8d651bdf6e8aded451a051b0be6068b3efe6c642b94251e1bd2dce5b0e6cc56c156ceddd66b3ad6adb97225ed1f562cbe28ae24f25dc92ebdf597d57f9ddccf684edbda5f6a5fb77e0760877dcdde9baf3589962595ed9d0aee05dade5ccf2a2f2b7bb57ecbe56615b71600f698f648fb432a8b2bd4aaf6a47d5a7eaa4ea811a8f9ae6bdea7bb7ed9ddac7dbd7bfdf6d7fd3018d03c5073e1e141cbc7fc8f7506bad416dc561dce1acc3cfeba2eababf677f5f7f44ed48f191cf478547a5c7c28f75d53bd4d737a8379436c28d92c6b1e371c76ffde0f5437b13abe95033a3b9f804382139f1e2c7f81fef9e0c3cd9798a7daae927fd9ff6b6d05a8a5aa1d6dcd689b6a436697b4c7bdfe980d39d1dce1d2d3f9bff7cf48cf6999ab3ca674bcf91ce159c9b399f777ef242c685f18b8917873a57743ebab4e4d29daeb0aedecb8197af5ef1b972a9dbbdfbfc5597ab67ae395d3b7d9d7dbded86fd8dd61ebb9e965fec7e69e9b5ef6dbde970b3fd96e3ad8ebe057de7fa5dfb2fdef6ba7de58eff9d1b038b06faee2ebe7bff5edc3de97ddefdd107a90f5e3fcc7a38fd68fd63ece3a2270a4f2a9eaa3fadfdd5f8d766a9bdf4eca0d760cfb388678f86b8432fff95f9af4fc305cfa9cf2b46b446ea47ad47cf8cf98cdd7ab1f4c5f0cb8c97d3e385bf29feb6f795d1ab9f7e77fbbd6762c9c4f06bd1eb993f4adea8be39fad6f66de764e8e4d37769efa6a78adeabbe3ff681fda1fb63f4c791e9ec4ff84f959f8d3f777c09fcf278266d66e6dff784f3fb0a656e6473747265616d`, "hex");
  //     const stream = new pdf.Stream();
  //     stream.fromPDF(data);
  //     console.log(stream.toJSON());
  //     const decoded = await stream.decode();
  //     // console.log(Buffer.from(decoded).toString());
  //   })
  // });
});
