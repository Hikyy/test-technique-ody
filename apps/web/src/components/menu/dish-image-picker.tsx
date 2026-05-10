"use client";

import { Spinner } from "@ody/ui";
import { ImagePlus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { toast } from "sonner";
import { apiBaseUrl } from "@/lib/api-client";
import { useUploadDishImage } from "@/lib/hooks/use-upload-dish-image";

interface DishImagePickerProps {
  value: string;
  onChange: (url: string) => void;
  invalid?: boolean;
}

export function DishImagePicker({ value, onChange, invalid }: DishImagePickerProps) {
  const tMenu = useTranslations("menu");
  const tCommon = useTranslations("common");
  const upload = useUploadDishImage();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const previewUrl = resolvePreviewUrl(value);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    upload.mutate(file, {
      onSuccess: (resource) => {
        onChange(resource.attributes.url);
        toast.success(tMenu("imageUploaded"));
      },
      onError: (err) => toast.error(err.message),
      onSettled: () => {
        if (inputRef.current) inputRef.current.value = "";
      },
    });
  };

  const handleClear = () => {
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={handleFileChange}
        aria-label={tMenu("uploadImage")}
      />

      <div
        className={`flex items-center gap-3 rounded-[8px] border bg-surface p-2 transition-colors ${
          invalid ? "border-neg" : "border-line-mid"
        }`}
      >
        <ImagePreview url={previewUrl} pending={upload.isPending} />

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={upload.isPending}
            className="inline-flex h-8 w-fit items-center gap-1.5 rounded-[6px] border border-line bg-bg px-2.5 text-[12px] font-medium text-ink transition-colors hover:bg-accent-soft disabled:opacity-50"
          >
            <ImagePlus className="size-3.5" aria-hidden />
            {value ? tMenu("replaceImage") : tMenu("uploadImage")}
          </button>

          {value && !upload.isPending && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex h-7 w-fit items-center gap-1 text-[11.5px] text-ink-3 transition-colors hover:text-neg"
            >
              <Trash2 className="size-3" aria-hidden />
              {tCommon("delete")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ImagePreview({ url, pending }: { url: string | null; pending: boolean }) {
  if (pending) {
    return (
      <div className="grid size-16 shrink-0 place-items-center rounded-[6px] bg-bg">
        <Spinner />
      </div>
    );
  }

  if (!url) {
    return (
      <div className="grid size-16 shrink-0 place-items-center rounded-[6px] border border-dashed border-line-mid bg-bg text-ink-3">
        <ImagePlus className="size-5" aria-hidden />
      </div>
    );
  }

  // biome-ignore lint/performance/noImgElement: external URLs + dynamic uploads, Next/Image config not relevant here
  return <img src={url} alt="" className="size-16 shrink-0 rounded-[6px] object-cover" />;
}

function resolvePreviewUrl(value: string): string | null {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `${apiBaseUrl}${value.startsWith("/") ? value : `/${value}`}`;
}
