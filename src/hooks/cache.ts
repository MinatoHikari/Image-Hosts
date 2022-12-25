import { Cache } from "@raycast/api";
import { useEffect, useRef, useState } from "react";

export enum Storage {
  Store = "store",
}

export enum Source {
  Catbox = "catbox",
  SMMS = "smms",
  ImgURL = "ImgURL",
  Chevereto = "chevereto",
}

export type List = {
  from: Source;
  src: string;
};

const cache = new Cache();

export const useCache = (callback?: () => void) => {
  if (!cache.has(Storage.Store)) cache.set(Storage.Store, JSON.stringify([]));
  const init = useRef(false);

  const [imageList, setImageList] = useState(JSON.parse(cache.get(Storage.Store) ?? "[]") as List[]);

  const addImage = (src: string, from: Source) => {
    setImageList((state) => [...state, { src, from }]);
  };

  const removeImage = (src: string) => {
    setImageList((state) => [...state.filter((i) => i.src !== src)]);
  };

  const removeAll = () => {
    setImageList([]);
  };

  useEffect(() => {
    if (init.current) {
      cache.set(Storage.Store, JSON.stringify(imageList));
      callback && callback();
    } else {
      init.current = true;
    }
  }, [imageList]);

  return {
    addImage,
    removeImage,
    removeAll,
    imageList,
  };
};
