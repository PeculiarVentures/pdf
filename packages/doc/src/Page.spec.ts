import { Convert } from "pvtsutils";
import { PDFDocument } from "./Document";
import { FormObject } from "./FormObject";
import { createPdfWithPage, PdfRenderingHelper } from "@peculiar/pdf-tests";

const imagePngB64 =
  "iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAFD0lEQVRYR82YC1BUZRTHf4gsgrosoIgQ4KNFNLB0NCrHycwcDUsbzddYMdRopmalk48yG8uaSrMa0x46jdM4VjZOMUWjTaLZOBYSUEBZKBBqvB/LAtKCNOe697rA7l3ZXR9nZufe/e79zve7//t93z3n+OEb2wysN45ajKXwI/G4CdjoC9d+PnAyAKgSPzFzTlL25Tg5rQDk5Ky3/n0BuB7Y3H/EowyavIfKo0tUFV8DXrjegMFAk0Dc9NBP9ImcQGtVtqpiLXCrtyp6q+AzwLZ+w+cSOfVzTSwHFd8CnvdGRW8BO2Tw6JmZBEVN0jgcVLQAt3ijojeAK4D3+g55kMHTv+4mUsXhVBpP7ZH2bcBznqroDaBT9VQQBxVbgHhPVfQUUFEvOOY+omYccilO+aG5WE/v90pFTwF11XOiog0Y5omKngAq6smikMXhzv7NmEFT6bceq+gOMBZIcvLrtnJdgV6o+JmzB+5QLxcCjr98oEDvIQUwygFgtH1zlaNLu1L1VAfn0ifTcs6t2n/b4QU6D/gNOCWAynxyZv5BEQSEmDGYzASExCvnASYzhpB4/HoHuXu72vWO9gvYLCW0NZZgayy+dGw4TWt1DjbLGV0/CmCAcRiG0FEYwpMwhCURqBwTrxjA2xvbms7T1ljMf7UFCnRrda5y7GhvxS9s3IaOsPESHd1Y1li0j4rvF6IoGDp2LeHJr98whJY/P6EyM03h0eag6bbVDLhTvu3X1xryd1B1bJkKsUoAFwMfSotp9EoGTHjnuhHW522l+vhqdfyVst+q+6AGGZL4FAMnvn/NIeuyN1Pzy4vquMsBBcJxo9YgJbeIuFsR9ZqYgAmg3Z5U32hXQPl/GTIhjYh7dl91wOrjq6jPe1sdZwmgZF2qOfvUaZBqnnG1KKt+XEpDwQcu4ZwpqN58GdK8kEFT9vqc0SGgFd/dlNNTsBtkv+EPEzn1C59Blh+ah/W05s8lnJ6CKoySkIckLmPgxO0+A6w6tpyGfGWRuk1N3YVb3wApEZN2YRz5uM8ALX/spvLIE+JPkplZeo7dAZYCsTFzsggcqFQMfGISCJTtHyu+igCzp4AGoFU6D02rwT8wzCdwqpOinZo2Mo6kBE5NT0GRLMs/eBBDHyv3KZw4K903Alv9X3IqcZ3LqFoPUCbdruDYaUSlfOdzwPKDs7GeOSB+ZwPKiTPTA3wXeDp07DrCk2WxubeW80c6VRj0etRmbaT2pBKHbgBe9QRQZJsmnztjwqXYzJXJpK85sY7msoMKYNj4jW5BRT1REfgMWOAJoEwQc9e6i6MjCdFrszdhLeq+ibsDtVmKKd0rqTK/Ay6TNFevOBSoBnoNWVRC7/5xnR5QJndd3hYshR87tr8BrLW/Lq0uKHM4dMwap4qWfBpHm/Wfi4CMJ4WmbuYKUEpVmQGmeOIWnNI6yVM3FOygPneLoyOJywSs3qHRaC8Ba0WjvkNnKQGxYxXsfEYKzaUZ0u122TF6Aigx9/a+Qx5g8PR02qxlNBTspO7XTnmLvFcBK9aZntH2KutS9Z5+N8/HlLSCPpF3UXNiDXU5b8qlRYDTiMSVglulZCZP3MtgVOK1izalkCqWDrwM5OiunM4XR9oLmalqszEhlaDoe6n44RFpegV4qScKfgXM9A+OpL1Z26QPAvK4h3sA1vXWZOBZYF6XC1Kend8TQFlZauZ+VJIXvc3UA+ApdtD77X1zgTHO/PwPqpOcplT5ik0AAAAASUVORK5CYII=";
const imagePngRaw = Convert.FromBase64(imagePngB64);
const imageJpegB64 =
  "/9j/4AAQSkZJRgABAgEArACsAAD/4hAISUNDX1BST0ZJTEUAAQEAAA/4YXBwbAIQAABtbnRyUkdCIFhZWiAH5QAIAAcADQAQAAZhY3NwQVBQTAAAAABBUFBMAAAAAAAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLWFwcGwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABJkZXNjAAABXAAAAGJkc2NtAAABwAAABJxjcHJ0AAAGXAAAACN3dHB0AAAGgAAAABRyWFlaAAAGlAAAABRnWFlaAAAGqAAAABRiWFlaAAAGvAAAABRyVFJDAAAG0AAACAxhYXJnAAAO3AAAACB2Y2d0AAAO/AAAADBuZGluAAAPLAAAAD5jaGFkAAAPbAAAACxtbW9kAAAPmAAAACh2Y2dwAAAPwAAAADhiVFJDAAAG0AAACAxnVFJDAAAG0AAACAxhYWJnAAAO3AAAACBhYWdnAAAO3AAAACBkZXNjAAAAAAAAAAhEaXNwbGF5AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAbWx1YwAAAAAAAAAmAAAADGhySFIAAAAUAAAB2GtvS1IAAAAMAAAB7G5iTk8AAAASAAAB+GlkAAAAAAASAAACCmh1SFUAAAAUAAACHGNzQ1oAAAAWAAACMGRhREsAAAAcAAACRm5sTkwAAAAWAAACYmZpRkkAAAAQAAACeGl0SVQAAAAYAAACiGVzRVMAAAAWAAACoHJvUk8AAAASAAACtmZyQ0EAAAAWAAACyGFyAAAAAAAUAAAC3nVrVUEAAAAcAAAC8mhlSUwAAAAWAAADDnpoVFcAAAAKAAADJHZpVk4AAAAOAAADLnNrU0sAAAAWAAADPHpoQ04AAAAKAAADJHJ1UlUAAAAkAAADUmVuR0IAAAAUAAADdmZyRlIAAAAWAAADim1zAAAAAAASAAADoGhpSU4AAAASAAADsnRoVEgAAAAMAAADxGNhRVMAAAAYAAAD0GVuQVUAAAAUAAADdmVzWEwAAAASAAACtmRlREUAAAAQAAAD6GVuVVMAAAASAAAD+HB0QlIAAAAYAAAECnBsUEwAAAASAAAEImVsR1IAAAAiAAAENHN2U0UAAAAQAAAEVnRyVFIAAAAUAAAEZnB0UFQAAAAWAAAEemphSlAAAAAMAAAEkABMAEMARAAgAHUAIABiAG8AagBpzuy37AAgAEwAQwBEAEYAYQByAGcAZQAtAEwAQwBEAEwAQwBEACAAVwBhAHIAbgBhAFMAegDtAG4AZQBzACAATABDAEQAQgBhAHIAZQB2AG4A/QAgAEwAQwBEAEwAQwBEAC0AZgBhAHIAdgBlAHMAawDmAHIAbQBLAGwAZQB1AHIAZQBuAC0ATABDAEQAVgDkAHIAaQAtAEwAQwBEAEwAQwBEACAAYQAgAGMAbwBsAG8AcgBpAEwAQwBEACAAYQAgAGMAbwBsAG8AcgBMAEMARAAgAGMAbwBsAG8AcgBBAEMATAAgAGMAbwB1AGwAZQB1AHIgDwBMAEMARAAgBkUGRAZIBkYGKQQaBD4EOwRMBD4EQAQ+BDIEOAQ5ACAATABDAEQgDwBMAEMARAAgBeYF0QXiBdUF4AXZX2mCcgBMAEMARABMAEMARAAgAE0A4AB1AEYAYQByAGUAYgBuAP0AIABMAEMARAQmBDIENQRCBD0EPgQ5ACAEFgQaAC0ENAQ4BEEEPwQ7BDUEOQBDAG8AbABvAHUAcgAgAEwAQwBEAEwAQwBEACAAYwBvAHUAbABlAHUAcgBXAGEAcgBuAGEAIABMAEMARAkwCQIJFwlACSgAIABMAEMARABMAEMARAAgDioONQBMAEMARAAgAGUAbgAgAGMAbwBsAG8AcgBGAGEAcgBiAC0ATABDAEQAQwBvAGwAbwByACAATABDAEQATABDAEQAIABDAG8AbABvAHIAaQBkAG8ASwBvAGwAbwByACAATABDAEQDiAOzA8cDwQPJA7wDtwAgA78DuAPMA70DtwAgAEwAQwBEAEYA5AByAGcALQBMAEMARABSAGUAbgBrAGwAaQAgAEwAQwBEAEwAQwBEACAAYQAgAEMAbwByAGUAczCrMOkw/ABMAEMARHRleHQAAAAAQ29weXJpZ2h0IEFwcGxlIEluYy4sIDIwMjEAAFhZWiAAAAAAAADzFgABAAAAARbKWFlaIAAAAAAAAIL0AAA9ZP///7xYWVogAAAAAAAATCQAALSFAAAK5lhZWiAAAAAAAAAnvgAADhcAAMiLY3VydgAAAAAAAAQAAAAABQAKAA8AFAAZAB4AIwAoAC0AMgA2ADsAQABFAEoATwBUAFkAXgBjAGgAbQByAHcAfACBAIYAiwCQAJUAmgCfAKMAqACtALIAtwC8AMEAxgDLANAA1QDbAOAA5QDrAPAA9gD7AQEBBwENARMBGQEfASUBKwEyATgBPgFFAUwBUgFZAWABZwFuAXUBfAGDAYsBkgGaAaEBqQGxAbkBwQHJAdEB2QHhAekB8gH6AgMCDAIUAh0CJgIvAjgCQQJLAlQCXQJnAnECegKEAo4CmAKiAqwCtgLBAssC1QLgAusC9QMAAwsDFgMhAy0DOANDA08DWgNmA3IDfgOKA5YDogOuA7oDxwPTA+AD7AP5BAYEEwQgBC0EOwRIBFUEYwRxBH4EjASaBKgEtgTEBNME4QTwBP4FDQUcBSsFOgVJBVgFZwV3BYYFlgWmBbUFxQXVBeUF9gYGBhYGJwY3BkgGWQZqBnsGjAadBq8GwAbRBuMG9QcHBxkHKwc9B08HYQd0B4YHmQesB78H0gflB/gICwgfCDIIRghaCG4IggiWCKoIvgjSCOcI+wkQCSUJOglPCWQJeQmPCaQJugnPCeUJ+woRCicKPQpUCmoKgQqYCq4KxQrcCvMLCwsiCzkLUQtpC4ALmAuwC8gL4Qv5DBIMKgxDDFwMdQyODKcMwAzZDPMNDQ0mDUANWg10DY4NqQ3DDd4N+A4TDi4OSQ5kDn8Omw62DtIO7g8JDyUPQQ9eD3oPlg+zD88P7BAJECYQQxBhEH4QmxC5ENcQ9RETETERTxFtEYwRqhHJEegSBxImEkUSZBKEEqMSwxLjEwMTIxNDE2MTgxOkE8UT5RQGFCcUSRRqFIsUrRTOFPAVEhU0FVYVeBWbFb0V4BYDFiYWSRZsFo8WshbWFvoXHRdBF2UXiReuF9IX9xgbGEAYZRiKGK8Y1Rj6GSAZRRlrGZEZtxndGgQaKhpRGncanhrFGuwbFBs7G2MbihuyG9ocAhwqHFIcexyjHMwc9R0eHUcdcB2ZHcMd7B4WHkAeah6UHr4e6R8THz4faR+UH78f6iAVIEEgbCCYIMQg8CEcIUghdSGhIc4h+yInIlUigiKvIt0jCiM4I2YjlCPCI/AkHyRNJHwkqyTaJQklOCVoJZclxyX3JicmVyaHJrcm6CcYJ0kneierJ9woDSg/KHEooijUKQYpOClrKZ0p0CoCKjUqaCqbKs8rAis2K2krnSvRLAUsOSxuLKIs1y0MLUEtdi2rLeEuFi5MLoIuty7uLyQvWi+RL8cv/jA1MGwwpDDbMRIxSjGCMbox8jIqMmMymzLUMw0zRjN/M7gz8TQrNGU0njTYNRM1TTWHNcI1/TY3NnI2rjbpNyQ3YDecN9c4FDhQOIw4yDkFOUI5fzm8Ofk6Njp0OrI67zstO2s7qjvoPCc8ZTykPOM9Ij1hPaE94D4gPmA+oD7gPyE/YT+iP+JAI0BkQKZA50EpQWpBrEHuQjBCckK1QvdDOkN9Q8BEA0RHRIpEzkUSRVVFmkXeRiJGZ0arRvBHNUd7R8BIBUhLSJFI10kdSWNJqUnwSjdKfUrESwxLU0uaS+JMKkxyTLpNAk1KTZNN3E4lTm5Ot08AT0lPk0/dUCdQcVC7UQZRUFGbUeZSMVJ8UsdTE1NfU6pT9lRCVI9U21UoVXVVwlYPVlxWqVb3V0RXklfgWC9YfVjLWRpZaVm4WgdaVlqmWvVbRVuVW+VcNVyGXNZdJ114XcleGl5sXr1fD19hX7NgBWBXYKpg/GFPYaJh9WJJYpxi8GNDY5dj62RAZJRk6WU9ZZJl52Y9ZpJm6Gc9Z5Nn6Wg/aJZo7GlDaZpp8WpIap9q92tPa6dr/2xXbK9tCG1gbbluEm5rbsRvHm94b9FwK3CGcOBxOnGVcfByS3KmcwFzXXO4dBR0cHTMdSh1hXXhdj52m3b4d1Z3s3gReG54zHkqeYl553pGeqV7BHtje8J8IXyBfOF9QX2hfgF+Yn7CfyN/hH/lgEeAqIEKgWuBzYIwgpKC9INXg7qEHYSAhOOFR4Wrhg6GcobXhzuHn4gEiGmIzokziZmJ/opkisqLMIuWi/yMY4zKjTGNmI3/jmaOzo82j56QBpBukNaRP5GokhGSepLjk02TtpQglIqU9JVflcmWNJaflwqXdZfgmEyYuJkkmZCZ/JpomtWbQpuvnByciZz3nWSd0p5Anq6fHZ+Ln/qgaaDYoUehtqImopajBqN2o+akVqTHpTilqaYapoum/adup+CoUqjEqTepqaocqo+rAqt1q+msXKzQrUStuK4trqGvFq+LsACwdbDqsWCx1rJLssKzOLOutCW0nLUTtYq2AbZ5tvC3aLfguFm40blKucK6O7q1uy67p7whvJu9Fb2Pvgq+hL7/v3q/9cBwwOzBZ8Hjwl/C28NYw9TEUcTOxUvFyMZGxsPHQce/yD3IvMk6ybnKOMq3yzbLtsw1zLXNNc21zjbOts83z7jQOdC60TzRvtI/0sHTRNPG1EnUy9VO1dHWVdbY11zX4Nhk2OjZbNnx2nba+9uA3AXcit0Q3ZbeHN6i3ynfr+A24L3hROHM4lPi2+Nj4+vkc+T85YTmDeaW5x/nqegy6LzpRunQ6lvq5etw6/vshu0R7ZzuKO6070DvzPBY8OXxcvH/8ozzGfOn9DT0wvVQ9d72bfb794r4Gfio+Tj5x/pX+uf7d/wH/Jj9Kf26/kv+3P9t//9wYXJhAAAAAAADAAAAAmZmAADypwAADVkAABPQAAAKW3ZjZ3QAAAAAAAAAAQABAAAAAAAAAAEAAAABAAAAAAAAAAEAAAABAAAAAAAAAAEAAG5kaW4AAAAAAAAANgAArgAAAFIAAABDwAAAsMAAACaAAAANQAAAUAAAAFRAAAIzMwACMzMAAjMzAAAAAAAAAABzZjMyAAAAAAABDHIAAAX4///zHQAAB7oAAP1y///7nf///aQAAAPZAADAcW1tb2QAAAAAAAAGEAAAoEQAAAAA2ZNWiQAAAAAAAAAAAAAAAAAAAAB2Y2dwAAAAAAADAAAAAmZmAAMAAAACZmYAAwAAAAJmZgAAAAIzMzQAAAAAAjMzNAAAAAACMzM0AP/uAA5BZG9iZQBkAAAAAAH/2wBDAAwICAgICAwICAwQCwsLDA8ODQ0OFBIODhMTEhcUEhQUGhsXFBQbHh4nGxQkJycnJyQyNTU1Mjs7Ozs7Ozs7Ozv/2wBDAQ0KCgwKDA4MDA4RDg4MDREUFA8PERQQERgREBQUExQVFRQTFBUVFRUVFRUaGhoaGhoeHh4eHiMjIyMnJycsLCz/2wBDAg0KCgwKDA4MDA4RDg4MDREUFA8PERQQERgREBQUExQVFRQTFBUVFRUVFRUaGhoaGhoeHh4eHiMjIyMnJycsLCz/wAARCAAwADADACIAAREBAhEC/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMAAAERAhEAPwCUGng1CDTwa8s+taJQaeDWhoWjf2lIJJ2KQAkDH3nI6gegGeT+FdfBpthbKFhgjXHfaGb8Sck1tSoSqK97I4cVmFLDy5LOclulol8+5wYNPBrf8US2cMSW0ccYnchiwVQyqPfGeTXOg1NSPJLlvexph631imqnK4c17Ju+i6mcDU9tC9zPHbx8vK6ov1JxVUGtbw/Ez3Es6/eii2xn0kmIhT/0PP4VnBc0kv6t1OmtL2dOUuqWl+70X4nU2pns7RH0+2NyZSUhGQirFHwGJP8AeJLe+faquqa5rVgiLNBDC0u7YQ3mEYxnjOO9XNW1C80e2zbQR/Z4VjRXkY5Y9AqqvPA9SK4++1K61Kfz7ptzAYUAYVR6AV1Vans1yqUlKy0SsvPpc8nB4f6zL2s6dOVNt+825TfZWUuVW0vdBJPLPI00zF3c5ZjyTQDUINPBrmuerypKy0S6GcDWzZ3b6VpcV1EFM1xeblDDIKQLgZ5H8Un6Vhg08MfyqYy5dVvbRl1aSqpRl8N7td0un32fyNLUNZvtVZTdvlV+6ijag98ev1qqDUQNOBocnJ3bu31YRpxpxUYRUYrZJWRMDTwahBp4NMTR/9k=";
const imageJpegRaw = Convert.FromBase64(imageJpegB64);

describe("Page", () => {
  describe("Image", () => {
    it("should add simple PNG image", async () => {
      const doc = await createPdfWithPage();
      const page = doc.pages.get(0);

      const image = doc.createImage(imagePngRaw);
      page.graphics().translate("1cm", "1cm").drawImage(image, "20mm", "20mm");
      page
        .graphics()
        .translate("3.5cm", "1cm")
        .rotate(45)
        .drawImage(image, "30mm", "30mm");
      const raw = await doc.save();

      const hash = await PdfRenderingHelper.getPageHash(raw, 1);

      const expectedHash: Record<string, string> = {
        darwin:
          "97afbc0da17a69ed79aa5833ffcb6e1d0bcba0cf9f0dbe8c22a01dac75ecebe7",
        linux:
          "9d1ee36dec23a7266823651855a44fc0e2b5bf2139d473a9d58224d4f6e9af13"
      };
      expect(hash).toEqual(expectedHash[process.platform]);
    });

    it("should add simple JPEG image", async () => {
      const doc = await createPdfWithPage();
      const page = doc.pages.get(0);

      const image = doc.createImage(imageJpegRaw);

      page.graphics().translate("5mm", "5mm").drawImage(image, "5mm", "5mm");

      page.graphics().translate("15mm", "5mm").drawImage(image, "10mm", "15mm");

      page.graphics().translate("30mm", "5mm").scale(2, 2).drawImage(image);

      const raw = await doc.save();
      const hash = await PdfRenderingHelper.getPageHash(raw, 1);

      const expectedHash: Record<string, string> = {
        darwin:
          "dc7b5f4535ae3f4ba0295520277abcf28e0f89e5b663ac518ca1781f8354e31b",
        linux:
          "9ae286debf575276a966629d3a866a7a1f80fe471005905ef18661adff58e8b6"
      };
      expect(hash).toEqual(expectedHash[process.platform]);
    });
  });

  it("should add FormObject with graphics", async () => {
    const doc = await createPdfWithPage();
    const page = doc.pages.get(0);

    const form = FormObject.create(doc, "2cm", "2cm");

    form
      .graphics()
      .fillColor([0x66 / 0xff, 0xb2 / 0xff, 0xff / 0xff])
      .rect(0, 0, form.width, form.height)
      .fill();

    form
      .graphics()
      .fillColor(0.25)
      .circle(form.width / 2 + 2, form.height / 2 - 2, "0.75cm")
      .fill();

    form
      .graphics()
      .fillColor(0)
      .circle(form.width / 2, form.height / 2, "0.75cm")
      .fill();

    page.graphics().translate(5, 5).drawObject(form);

    // translate near the previous form on horizontal + padding and scale
    page
      .graphics()
      .translate(form.width + 10, 5)
      .scale(2, 2)
      .drawObject(form);

    const raw = await doc.save();
    const hash = await PdfRenderingHelper.getPageHash(raw, 1);

    const expectedHash: Record<string, string> = {
      darwin:
        "28ac1661e14138f24d788cb8936bc220debe081f5fc2ec80c8b63e9038ba5761",
      linux: "2275593b3fbdbcaa0fcbb45d367ee6cbc99740be236a64e7cc7a05410577503d"
    };
    expect(hash).toEqual(expectedHash[process.platform]);
  });

  describe("Rectangle", () => {
    it("should add simple rectangle", async () => {
      const doc = await createPdfWithPage();
      const page = doc.pages.get(0);

      const graphics = page
        .graphics()
        .fillColor([0x66 / 0xff, 0xb2 / 0xff, 0xff / 0xff]);

      graphics
        .graphics()
        .translate(100, 100)
        .rotate(45)
        .rect(-50, -50, 100, 100, true)
        .fill();

      graphics
        .graphics()
        .strokeColor(0)
        .pathTo(100, 0)
        .pathLine(100, 200)
        .stroke();

      graphics
        .graphics()
        .strokeColor(0)
        .pathTo(0, 100)
        .pathLine(200, 100)
        .stroke();

      // graphics.rect("5cm", "5cm", "2cm", "2cm")
      //   .fill();

      const raw = await doc.save();
      const hash = await PdfRenderingHelper.getPageHash(raw, 1);

      const expectedHash: Record<string, string> = {
        darwin:
          "67e7ef2671f43a777b91f2c8238684badb60dab62c9d66fe362108f69fa04a19",
        linux:
          "c29308f76f37848b3f0080bdc99dedf1e605aeef05b1a5886736fc7896827cee"
      };
      expect(hash).toEqual(expectedHash[process.platform]);
    });

    it("should add rectangle with border", async () => {
      const doc = await createPdfWithPage();
      const page = doc.pages.get(0);

      page
        .graphics()
        .fillColor([0.5]) // gray
        .rect("2cm", "2cm", "2cm", "2cm")
        .fill();

      page
        .graphics()
        .strokeColor([1, 0, 0]) // red
        .lineWidth(2)
        .rect("2cm", "2cm", "2cm", "2cm")
        .stroke();

      const pdf = await doc.save();
      const hash = await PdfRenderingHelper.getPageHash(pdf, 1);
      expect(hash).toEqual(
        "d58c01c637d40b292a43a737369b45bc358fa2bdbbec3e488f4aab00627342bf"
      );
    });
  });

  describe("padding", () => {
    it("should have correct default padding values", async () => {
      const doc = await PDFDocument.create();

      const page = doc.pages.create({
        width: 200,
        height: 400
      });

      expect(page.leftPadding).toEqual(0);
      expect(page.topPadding).toEqual(0);
      expect(page.rightPadding).toEqual(0);
      expect(page.bottomPadding).toEqual(0);
    });

    it("should have correct padding values", async () => {
      const doc = await PDFDocument.create();

      const page = doc.pages.create({
        width: 200,
        height: 400
      });

      page.leftPadding = 10;
      page.topPadding = 15;
      page.rightPadding = 20;
      page.bottomPadding = 25;

      expect(page.target.CropBox?.llX).toEqual(10);
      expect(page.leftPadding).toEqual(10);
      expect(page.target.CropBox?.llY).toEqual(25);
      expect(page.bottomPadding).toEqual(25);
      expect(page.target.CropBox?.urX).toEqual(180);
      expect(page.rightPadding).toEqual(20);
      expect(page.target.CropBox?.urY).toEqual(385);
      expect(page.topPadding).toEqual(15);
    });
  });
});
