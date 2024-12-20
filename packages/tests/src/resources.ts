import * as fs from "node:fs";
import * as path from "node:path";

/**
 * A JPEG image. 496x218 pixels.
 */
export const jpegImage = fs.readFileSync(
  path.join(__dirname, "resources", "image.jpg")
);
