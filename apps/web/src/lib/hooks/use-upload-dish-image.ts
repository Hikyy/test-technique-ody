"use client";

import { useMutation } from "@tanstack/react-query";
import { apiUpload } from "@/lib/api-client";

export interface UploadResource {
  type: "uploads";
  id: string;
  attributes: {
    url: string;
    mime: string;
    bytes: number;
  };
}

export function useUploadDishImage() {
  return useMutation<UploadResource, Error, File>({
    mutationFn: (file) => {
      const form = new FormData();
      form.append("file", file);
      return apiUpload<UploadResource>("/api/uploads/dishes", form);
    },
  });
}
