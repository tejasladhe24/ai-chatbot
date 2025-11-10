import { createDocumentHandler } from "@workspace/artifact";
import { experimental_generateImage } from "@workspace/ai";
import { openai } from "@ai-sdk/openai";

export const imageDocumentHandler = createDocumentHandler<"image">({
  kind: "image",
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = "";

    const { image } = await experimental_generateImage({
      model: openai.imageModel("dall-e-3"),
      prompt: title,
      n: 1,
    });

    draftContent = image.base64;

    dataStream.write({
      type: "data-imageDelta",
      data: image.base64,
      transient: true,
    });

    return draftContent;
  },
  onUpdateDocument: async ({ description, dataStream }) => {
    let draftContent = "";

    const { image } = await experimental_generateImage({
      model: openai.imageModel("dall-e-3"),
      prompt: description,
      n: 1,
    });

    draftContent = image.base64;

    dataStream.write({
      type: "data-imageDelta",
      data: image.base64,
      transient: true,
    });

    return draftContent;
  },
});
