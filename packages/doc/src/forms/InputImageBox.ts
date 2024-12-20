import * as core from "@peculiarventures/pdf-core";
import { Image } from "../Image";
import { ResourceManager } from "../ResourceManager";
import { FormComponent } from "./FormComponent";

export class InputImageBox extends FormComponent {
  private _image?: Image | null;

  public get image(): Image | null {
    if (this._image) {
      return this._image;
    }

    if (this.target.AP.has()) {
      const dict = this.target.AP.get().N;
      if (dict instanceof core.PDFDictionary) {
        const form = dict.to(core.FormDictionary);
        if (form.Resources.has()) {
          const resources = form.Resources.get();
          if (resources.XObject && resources.XObject.items.size) {
            const firstKey = [...resources.XObject.items.keys()][0];
            const firstEntry = resources.XObject.get(firstKey);
            if (
              firstEntry instanceof core.PDFDictionary &&
              firstEntry.has("Subtype") &&
              firstEntry.get("Subtype", core.PDFName).text === "Image"
            ) {
              return new Image(
                firstEntry.to(core.ImageDictionary),
                this.document
              );
            }
          }
        }
      }
    }

    return null;
  }

  public set image(value: Image | null) {
    if (this._image === value) {
      return;
    }

    const doc = this.document.target;
    const update = doc.update;

    // Create resource
    const form = core.FormDictionary.create(update);
    if (!value) {
      // Clear image
      form.stream = new Uint8Array();

      this.target.MK.get().I = null;
      this.target.AP.get().N = form.makeIndirect();
    } else {
      form.bBox.urX = value.width;
      form.bBox.urY = value.height;
      const resources = new ResourceManager(
        form.Resources.get(),
        this.document
      );
      const resource = resources.set(value.target);

      // Draw image
      const content = new core.PDFContent();
      content
        .graphicsBegin()
        .concatMatrix(value.width, 0, 0, value.height, 0, 0)
        .drawXObject(resource.name)
        .graphicsEnd();
      form.stream = content.toUint8Array();

      this.target.MK.get().I = form.makeIndirect();
      this.target.AP.get().N = form;
    }

    this._image = value;
  }
}
