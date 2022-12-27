import * as assert from "assert";
import * as x509 from "@peculiar/x509";
import { CRL } from "./CRL";
import { DefaultCertificateStorageHandler } from "./DefaultCertificateStorageHandler";
import { ICertificateStorageHandler, IResult, RevocationType } from "./ICertificateStorageHandler";
import { OCSP } from "./OCSP";

context("DefaultCertificateStorageHandler", () => {

  it("fetchRevocation with stopPropagation", async () => {
    (globalThis as any).fetch = await import("node-fetch");
    const issuer = new x509.X509Certificate("MIIG6zCCBNOgAwIBAgIQeSmaexvS3f0QpnfHL1JU9TANBgkqhkiG9w0BAQwFADBSMQswCQYDVQQGEwJCRTEZMBcGA1UEChMQR2xvYmFsU2lnbiBudi1zYTEoMCYGA1UEAxMfR2xvYmFsU2lnbiBTZWN1cmUgTWFpbCBSb290IFI0NTAeFw0yMDAxMjAwMDAwMDBaFw0yNzAxMjAwMDAwMDBaMGIxCzAJBgNVBAYTAkJFMRkwFwYDVQQKExBHbG9iYWxTaWduIG52LXNhMTgwNgYDVQQDEy9HbG9iYWxTaWduIENvcnBvcmF0ZSBJVCBBdGxhcyBSNDUgU01JTUUgQ0EgMjAyMTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBALmLoYT_vTd8M9b57KT3WrbFnqNQBWS3nXQH0dWsXx9g9vXycWHQncs3zvw1wf0NrhHeZgkwL4b1sjNWJBNxo_DYz6LdgLWZR1h6cFqfl4YZPN7iqelISBROMfFg4JlQgSIFpEz4Ab1ptdAcnNYDVOgMtqvuBO30uGZwJQa-ObwgJGO_ihUrhfCCFB55gz3PgGnEUP2boSEwjqzFUxzClL9etbbDUIa3tlpO4T8evAEcQ3KfG5bdbyDRyqlwEvRZapRwmvQeD4kd_zAxFRHwwP8w9pys600_MXk2YJzB7_WiYidRXukwDA2bBgeT2YklWhcfyhoB3B9w4VWn2PJ2YtE-3PqR1lp9Q-9I2GCAFZX4vOl2qSAUIi5piI9zU_RleNl-EV9lxCIWR0qcWDw3kM_kGusHfs6r6BBQIon14lsTIPi0t2Q98EUVgEALMkzdWvR1w6v9ub66qMLgAUe-mWweyd6gN9_sTBy9uKNJtxkZXxEWf4eoHjSGYFgWiPYXA3h6HLJEqDzndgX6oUECCK0X2PqoevYqDdrYc_Y7ke1TkpHG43mQKRcxgywV0z7XOPsGnXzlZiKanzB-QftBzg1FgtTEEofYNcT9bbTQ1xiUCT69ooEq9ndJMuXkXhiJyXXUZPAOjT4pYu-6oBq9bBX5rq3nECQqTvXs0Lj46cdTAgMBAAGjggGrMIIBpzAOBgNVHQ8BAf8EBAMCAYYwKQYDVR0lBCIwIAYIKwYBBQUHAwQGCSsGAQQBgjcVBQYJKwYBBAGCNxUGMBIGA1UdEwEB_wQIMAYBAf8CAQAwHQYDVR0OBBYEFGJ9uWbj1bWXMpYxQ3KGjEPSeJ72MB8GA1UdIwQYMBaAFKCTFShu7o8IsjXGnmJ5dKexDit7MIGJBggrBgEFBQcBAQR9MHswMwYIKwYBBQUHMAGGJ2h0dHA6Ly9vY3NwLmdsb2JhbHNpZ24uY29tL3NtaW1lcm9vdHI0NTBEBggrBgEFBQcwAoY4aHR0cDovL3NlY3VyZS5nbG9iYWxzaWduLmNvbS9jYWNlcnQvcjNzbXI0NWNyb3NzMjAyMC5jcnQwOwYDVR0fBDQwMjAwoC6gLIYqaHR0cDovL2NybC5nbG9iYWxzaWduLmNvbS9zbWltZXJvb3RyNDUuY3JsME0GA1UdIARGMEQwQgYKKwYBBAGgMgoDAjA0MDIGCCsGAQUFBwIBFiZodHRwczovL3d3dy5nbG9iYWxzaWduLmNvbS9yZXBvc2l0b3J5LzANBgkqhkiG9w0BAQwFAAOCAgEA2h3dySyXP4DIgt1ahFv5-hSG9COBnCaa8wLBQP7Qj6OuRrMkCtcLFH1j8MZNO_kp49nYPQKcLlQFmtmXVDyr35Pox8hOwpw46EGS80ZHPS-g50Aas2KomwwKy_gqT5hZEbetzJN4-gsM5NOOD7yb2B_dv6LChBXQnIU0h62JqbPpZe9HZXiIcqHWtTWJXojBVYGUKk9NYPLHaiM_4uDqAScS3gIcxxb6_qhVXBacdiF2ljuwDlzOxq41CyOnmedclj5O6uBZIaJ68yYre4UqZyqi_qWnFyJVne89r-pfNy7ftXYwYKX79ENbc6kb6WG67knv-DSwidSu9Gj6RNLFso9V_SXdrviNNnriHg15faC_ZVkCEMKg6fhZTYKTbSuego7Ls-Ykl1i43mrwlMvQDJc3-xb14vGmEQJG36vPSFoK86z22xb71nnXlWD03_Z_o-F5XketBAUoLJ_J9IWCdG1_-OaE5aLTiWmhkj7KR7Q1SUOPJAbbvOFYb2b7Bc0njQb_vTJ8hlUERkobTOm5gslJEWAuFtsjxlJPEppvbYq-ip32s-vyPKvVmeLk_2cy1NAxxGzU8U4kch9xzA6vo3UCUQy2T34bDQErxyG2Yt0SMFypCRlWKvREcPOVSRCzHsfpJ58ow5eZCOs9dw-5g7OQt48zvoK6hHSJqSOPIAQ");
    const cert = new x509.X509Certificate("MIIHdTCCBV2gAwIBAgIQATzOw1vjP-9-Pz4LXUe9DjANBgkqhkiG9w0BAQsFADBiMQswCQYDVQQGEwJCRTEZMBcGA1UEChMQR2xvYmFsU2lnbiBudi1zYTE4MDYGA1UEAxMvR2xvYmFsU2lnbiBDb3Jwb3JhdGUgSVQgQXRsYXMgUjQ1IFNNSU1FIENBIDIwMjEwHhcNMjIwMjIzMDQ1OTU0WhcNMjMwMjIzMDQ1OTU0WjBoMQswCQYDVQQGEwJCRTEXMBUGA1UECAwOVmxhYW1zLUJyYWJhbnQxDzANBgNVBAcMBkxldXZlbjEZMBcGA1UECgwQR2xvYmFsU2lnbiBudi1zYTEUMBIGA1UEAwwLTW9oaXQgS3VtYXIwggIiMA0GCSqGSIb3DQEBAQUAA4ICDwAwggIKAoICAQCYo4QuAHDUfJb_vqUXo4uHs_Nw3AujPkgfXMLBaMZ1vCdI6vMOsa-PLI5-L1-7cWeUF9dgI2EU-uXWZn2G7VgVne4b2KICQUInuTulCzJOrPRfO8xGxDiMKu_-VKO4t1RxofFlkbeM72WBIu4SNwApGRbgjgoxBoAThfCOUICIEvNyA6BoFgmZ7cdjpewz6kWQx_2s1AN7OXyn6XZoEYmpU_j5AYVSwY3xrTbBjQ_DvPy0HgBGWmEN8Tt64KXygOG5uqrme9tinQxHEDaHaO1hUcK_pM9npVgr3ViwWH6yZaousdCCe6mkaLZIkODT2eSua9U__hkUdw5zoSx9kgRrjGY4oN52Ers7UTpqG30_LRAkqsp7J0L86clmWROhzT2768BP4X3YmZ9acFltw-9tIsh9p4O85oxQ0bpugtbPq6J0k1HCP5Bm_7bAhI_PVZkeaWpWB6wCWhDSazT7D8l2rAkuxJRfgsoUSdhI6YvUavkVIHLsH3rqgbvkDrw3h2ekoUrGBvdI9fZfkEDm-XKM9Zs0Fdc9zDbXQdp8RAD0mVMLYnbZ8kn0XbNLpYLeDeBgTZ3i0667rj2Ch1FUI3s7bXYKEcxgfaAvMQ02L14-CEZWfXEk0mfs4kjueavcIUNsGasDNN6j22h6w1rOgW20YwsL9jH453icvi8F4NTF0QIDAQABo4ICHzCCAhswJQYDVR0RBB4wHIEabW9oaXQua3VtYXJAZ2xvYmFsc2lnbi5jb20wDgYDVR0PAQH_BAQDAgWgMBMGA1UdJQQMMAoGCCsGAQUFBwMEMD0GCSsGAQQBgjcVBwQwMC4GJisGAQQBgjcVCIaPkCaEoMBBhNWTK7zYI4fywymBYYXhkXqFz51DAgFkAgEUMB0GA1UdDgQWBBTbowJvhDU4JhxrLQWOtAQO0BEdaTBNBgNVHSAERjBEMEIGCisGAQQBoDIKAwIwNDAyBggrBgEFBQcCARYmaHR0cHM6Ly93d3cuZ2xvYmFsc2lnbi5jb20vcmVwb3NpdG9yeS8wDAYDVR0TAQH_BAIwADCBoQYIKwYBBQUHAQEEgZQwgZEwRQYIKwYBBQUHMAGGOWh0dHA6Ly9vY3NwLmdsb2JhbHNpZ24uY29tL2NhL2dzY29ycGl0YXRsYXNyNDVzbWltZWNhMjAyMTBIBggrBgEFBQcwAoY8aHR0cDovL3NlY3VyZS5nbG9iYWxzaWduLmNvbS9nc2NvcnBpdGF0bGFzcjQ1c21pbWVjYTIwMjEuY3J0MB8GA1UdIwQYMBaAFGJ9uWbj1bWXMpYxQ3KGjEPSeJ72ME0GA1UdHwRGMEQwQqBAoD6GPGh0dHA6Ly9jcmwuZ2xvYmFsc2lnbi5jb20vY2EvZ3Njb3JwaXRhdGxhc3I0NXNtaW1lY2EyMDIxLmNybDANBgkqhkiG9w0BAQsFAAOCAgEAr3WLqh149byT05jvZJ5BoYswn-Un2S7iH04VALYds_iC8tBvfQid-yPBgpX0u4s8QLQUNuugxci8XEzOb88UdWtjH7LyE3KajXHMMDLH8OofL3BKjhuQygNPnliI9j4DpWAZdOV_Ur_WawrNyQLOrzGJFfUUiTonhkDDLEcoX2ix219TuSxOoRLP3SI63NvfPwGwSYSLtWGEuaJFlBRiql9rTM-Dg1kA_3d9zUs2vDX2_fwg3U7sBAeGOmGNk27_PjXbcN6WH_aApgBW0LmpzWqUdu38VYF-od9Jg97eQ2u5v9xEYUf8VIV5o2u6y_1xbTf6VylSfpMFGhp-3-jdhN35KUdT5A2yqyzIDREbeFG3tVx1RsWEnVUa_NZ-oBHJtbiRSWGXFEH7h2ltBccED8DNbrqirgXDmo2Q5Dabc6pWQO5CLQ2g631Z7f9BXR3vaHJXoWHdQPUYQNQNx4cfnsN3vReKtp9WQua9lQ9JguaBKyt_gA6IItNfYqBmUiezGlXlWZA1hOHIK2SOhP5PK1hUlwvepsxJU5PMLhLifAIQV9QHwpN5fEtFmbTyHHS_HPx4yJ3KiPGoyx2oN0RJtpXI_kdveUxmsEUWNiPl6jL_jCZJZEGHW0749mSLA_-3_VmiWxj84OCNA15jHF2rpIKlSIARJZF1Sy7NWZDceVM");

    const certStorage: ICertificateStorageHandler = new DefaultCertificateStorageHandler();
    certStorage.certificates.push(issuer);

    const ocsp = await certStorage.fetchRevocation("ocsp", cert);
    assert.ok(ocsp.result instanceof OCSP);
    assert.equal(ocsp.target, certStorage);

    class ApplicationStorage extends DefaultCertificateStorageHandler {
      public override async fetchRevocation(type: "crl", cert: x509.X509Certificate): Promise<IResult<CRL | null>>;
      public override async fetchRevocation(type: "ocsp", cert: x509.X509Certificate): Promise<IResult<OCSP | null>>;
      public override async fetchRevocation(type: RevocationType, cert: x509.X509Certificate): Promise<IResult<CRL | OCSP | null>> {
        if (type === "ocsp") {
          return {
            result: null,
            target: this,
            stopPropagation: true,
          };
        }

        return super.fetchRevocation(type, cert);
      }
    }

    certStorage.parent = new ApplicationStorage();
    const ocsp2 = await certStorage.fetchRevocation("ocsp", cert);
    assert.equal(ocsp2.result, null);
    assert.equal(ocsp2.target, certStorage.parent);
  });

});