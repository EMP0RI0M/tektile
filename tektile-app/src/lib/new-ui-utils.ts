import { FileCollection, TreeItem } from "@/types/new-ui";

export function convertFilesToTreeItems(files: FileCollection): TreeItem[] {
  const root: any = {};

  Object.keys(files).forEach((path) => {
    const parts = path.split("/");
    let current = root;
    parts.forEach((part) => {
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    });
  });

  function transform(obj: any): TreeItem[] {
    return Object.entries(obj).map(([name, children]): TreeItem => {
      const subItems = transform(children);
      if (subItems.length === 0) {
        return name;
      }
      return [name, ...subItems];
    });
  }

  return transform(root);
}

export const MAX_SEGMENTS = 4;
