import { Crypto } from "@peculiar/webcrypto";
import { BufferSourceConverter, Convert } from "pvtsutils";
import * as src from "./StandardEncryptionAlgorithms";
import { PDFCryptoEngine } from "../CryptoEngine";

// Set the security revert option to avoid the CVE-2023-46809 vulnerability
process.env.NODE_OPTIONS = "--security-revert=CVE-2023-46809";

const U_R6 =
  "2c0d93dbc2af881b34939a8e8915c31f58da04e3c6cb6319855670d22fb5382b16565084e80fe283164672365d57c4da";
const UE_R6 =
  "2bb64001afaa25e57cfd20ac139bad507fda8a5dce02b951bbd6c7a667672437";
const O_R6 =
  "9e82c915374caa035acb2dd0af31ebedb7448d0711e6c7fabf3e6fd9073e66671ebbe26089ceb32ed40db5df8b2aaf24";
const OE_R6 =
  "f5113d714559c274724620dc5d5878a9c51f7f84f98076206c1a48c92abd9d1f";

describe("StandardEncryptionAlgorithm", () => {
  const crypto = new PDFCryptoEngine({ name: "pdf", crypto: new Crypto() });
  // O: ddbc87d3b71d554bb67a4b42c2fe9212a5c2bd37caf1127469340e8425cd2fa0
  // U: 48f1437c96950abc924b8e019980370400000000000000000000000000000000

  describe("algorithm2", () => {
    const tests: {
      name: string;
      params: src.StandardAlgorithm2Params;
      want: string;
    }[] = [
      {
        name: "default password",
        params: {
          id: Convert.FromHex("8D966A6EA9AE43E68A5B5E262C0AFEB5"),
          length: 128,
          o: Convert.FromHex(
            "DDBC87D3B71D554BB67A4B42C2FE9212A5C2BD37CAF1127469340E8425CD2FA0"
          ),
          permissions: -3392,
          password: "",
          encryptMetadata: true,
          revision: 4,
          crypto
        },
        want: "B64B049FB37F12FBA16F8C8E840AC68B"
      },
      {
        name: "default password",
        params: {
          id: Convert.FromHex("A204AB6AF65984019767B91004A5BE10"),
          length: 128,
          o: Convert.FromHex(
            "36451BD39D753B7C1D10922C28E6665AA4F3353FB0348B536893E3B1DB5C579B"
          ),
          permissions: -4076,
          password: "",
          encryptMetadata: false,
          revision: 4,
          crypto
        },
        want: "A268385041E5038D17C5E7F1027B950E"
      }
    ];

    for (const t of tests) {
      it(`${t.name}, revision: ${t.params.revision}, encryptMetadata: ${t.params.encryptMetadata}, length: ${t.params.length}`, async () => {
        const v = await src.StandardEncryptionAlgorithm.algorithm2(t.params);
        expect(Convert.ToHex(v)).toBe(t.want.toLocaleLowerCase());
      });
    }
  });

  describe("algorithm4", () => {
    const tests: {
      name: string;
      params: src.StandardAlgorithm5Params;
      want: {
        result: string;
        length: number;
      };
    }[] = [
      {
        name: "default password",
        params: {
          id: Convert.FromHex("8D966A6EA9AE43E68A5B5E262C0AFEB5"),
          length: 128,
          o: Convert.FromHex(
            "DDBC87D3B71D554BB67A4B42C2FE9212A5C2BD37CAF1127469340E8425CD2FA0"
          ),
          permissions: -3392,
          password: "",
          encryptMetadata: true,
          revision: 4,
          crypto
        },
        want: {
          result: "48f1437c96950abc924b8e0199803704",
          length: 16
        }
      }
    ];

    for (const t of tests) {
      it(`${t.name}, revision: ${t.params.revision}`, async () => {
        const v = await src.StandardEncryptionAlgorithm.algorithm5(t.params);
        const result = Convert.FromHex(t.want.result).slice(0, t.want.length);
        expect(Convert.ToHex(v.slice(0, t.want.length))).toBe(
          Convert.ToHex(result)
        );
      });
    }
  });

  describe("algorithm11", () => {
    const tests: {
      name: string;
      params: src.StandardAlgorithm11Params;
      want: boolean;
    }[] = [
      {
        name: "correct",
        params: {
          password: "",
          u: Buffer.from(U_R6, "hex"),
          crypto
        },
        want: true
      }
    ];

    for (const t of tests) {
      it(t.name, async () => {
        const res = await src.StandardEncryptionAlgorithm.algorithm11(t.params);
        expect(res).toBe(t.want);
      });
    }
  });

  describe("algorithm8", () => {
    const tests: {
      name: string;
      params: src.StandardAlgorithm8Params;
      want: {
        u: string;
        ue: string;
      };
    }[] = [
      {
        name: "correct",
        params: {
          password: "",
          random: Buffer.from("16565084e80fe283164672365d57c4da", "hex"),
          key: Buffer.from(
            "6efde11f7aed6160973ff07b31c20f0b610e58a4edc1d8764a9029ce3333a417",
            "hex"
          ),
          crypto
        },
        want: {
          u: U_R6,
          ue: UE_R6
        }
      }
    ];

    for (const t of tests) {
      it(t.name, async () => {
        const res = await src.StandardEncryptionAlgorithm.algorithm8(t.params);
        expect(Convert.ToHex(res.ue)).toBe(t.want.ue);
        expect(Convert.ToHex(res.u)).toBe(t.want.u);
      });
    }
  });

  describe("algorithm9", () => {
    const tests: {
      name: string;
      params: src.StandardAlgorithm9Params;
      want: {
        o: string;
        oe: string;
      };
    }[] = [
      {
        name: "correct",
        params: {
          password: "12345678",
          random: Buffer.from("1ebbe26089ceb32ed40db5df8b2aaf24", "hex"),
          key: Buffer.from(
            "6efde11f7aed6160973ff07b31c20f0b610e58a4edc1d8764a9029ce3333a417",
            "hex"
          ),
          u: Buffer.from(U_R6, "hex"),
          crypto
        },
        want: {
          o: O_R6,
          oe: OE_R6
        }
      }
    ];

    for (const t of tests) {
      it(t.name, async () => {
        const res = await src.StandardEncryptionAlgorithm.algorithm9(t.params);
        expect(Convert.ToHex(res.oe)).toBe(t.want.oe);
        expect(Convert.ToHex(res.o)).toBe(t.want.o);
      });
    }
  });

  describe("algorithm12", () => {
    const tests: {
      name: string;
      params: src.StandardAlgorithm12Params;
      want: boolean;
    }[] = [
      {
        name: "correct",
        params: {
          password: "12345678",
          o: Buffer.from(O_R6, "hex"),
          u: Buffer.from(U_R6, "hex"),
          crypto
        },
        want: true
      }
    ];

    for (const t of tests) {
      it(t.name, async () => {
        const res = await src.StandardEncryptionAlgorithm.algorithm12(t.params);
        expect(res).toBe(t.want);
      });
    }
  });

  describe("algorithm2A", () => {
    const tests: {
      name: string;
      params: src.StandardAlgorithm2AParams;
      want: string;
    }[] = [
      ...[
        {
          name: "user password",
          password: ""
        },
        {
          name: "owner password",
          password: "12345678"
        }
      ].map((o) => {
        return {
          name: o.name,
          params: {
            password: o.password,
            o: Buffer.from(O_R6, "hex"),
            oe: Buffer.from(OE_R6, "hex"),
            u: Buffer.from(U_R6, "hex"),
            ue: Buffer.from(UE_R6, "hex"),
            perms: Buffer.from("0876362f837fbe43c2591387b4232f82", "hex"),
            p: -2368,
            crypto
          },
          want: "6efde11f7aed6160973ff07b31c20f0b610e58a4edc1d8764a9029ce3333a417"
        };
      })
    ];

    for (const t of tests) {
      it(t.name, async () => {
        const eKey = await src.StandardEncryptionAlgorithm.algorithm2A(
          t.params
        );
        expect(Convert.ToHex(eKey)).toBe(t.want);
      });
    }
  });

  describe("padPassword", () => {
    const tests: {
      name: string;
      args?: BufferSource;
      want: ArrayBuffer;
    }[] = [
      {
        name: "password is undefined",
        want: Convert.FromHex(
          "28bf4e5e4e758a4164004e56fffa01082e2e00b6d0683e802f0ca9fe6453697a"
        )
      },
      {
        name: "password is shorter than 32-bytes",
        args: new Uint8Array([1, 2, 3, 4, 5]),
        want: Convert.FromHex(
          "010203040528bf4e5e4e758a4164004e56fffa01082e2e00b6d0683e802f0ca9"
        )
      },
      {
        name: "password is 32-bytes",
        args: Convert.FromHex(
          "0102030405010203040501020304050102030405010203040501020304050102"
        ),
        want: Convert.FromHex(
          "0102030405010203040501020304050102030405010203040501020304050102"
        )
      },
      {
        name: "password is longer than 32-bytes",
        args: Convert.FromHex(
          "0102030405010203040501020304050102030405010203040501020304050102030405"
        ),
        want: Convert.FromHex(
          "0102030405010203040501020304050102030405010203040501020304050102"
        )
      }
    ];
    for (const t of tests) {
      it(t.name, () => {
        const v = src.padPassword(t.args);
        expect(BufferSourceConverter.isEqual(v, t.want)).toBe(true);
      });
    }
  });
});
