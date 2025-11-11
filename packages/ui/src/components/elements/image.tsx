import type { Experimental_GeneratedImage } from "@workspace/ai";
import { cn } from "@workspace/ui/lib/utils";

export type ImageProps = Experimental_GeneratedImage & {
  className?: string;
  alt?: string;
};

export const Image = ({ base64, mediaType, ...props }: ImageProps) => (
  // biome-ignore lint/nursery/useImageSize: "Generated image without explicit size"
  // biome-ignore lint/performance/noImgElement: "Generated image without explicit size"
  <img
    {...props}
    alt={props.alt}
    className={cn(
      "h-auto max-w-full overflow-hidden rounded-md",
      props.className
    )}
    src={`data:${mediaType};base64,${base64}`}
  />
);
