import { getPreferenceValues } from "@raycast/api";
import { Chevereto } from "./hooks/urls";
import { FormScreen, GlobalPreference } from "./screens/form";
import { readFile } from "fs/promises";
import { Source } from "./hooks/cache";
import { Axios, AxiosResponse } from "axios";

type Prefrences = {
  key: string;
  hostname: string;
} & GlobalPreference;

type ImageBaseInfo = {
  filename: string;
  name: string;
  width: number;
  height: number;
  ratio: number;
  size: number;
  size_formatted: string;
  mime: string;
  extention: string;
  bits: number;
  channels: null;
  url: string;
};

type Response = {
  status_code: number;
  status_txt: string;
  success?: {
    message: string;
    code: number;
  };
  error?: {
    message: string;
    code: number;
  };
  image: ImageBaseInfo & {
    date: string;
    date_gmt: string;
    storage_id: string | null;
    description: string | null;
    nsfw: string;
    md5: string;
    storage: string;
    original_filename: string;
    original_exifdata: string | null;
    views: string;
    id_encoded: string;
    filename: string;
    url_viewer: string;
    thumb: ImageBaseInfo;
    medium: ImageBaseInfo;
    views_labels: string;
    display_url: string;
    how_long_ago: string;
  };
};

export default function Command() {
  const { hostname, key } = getPreferenceValues<Prefrences>();
  const requestUrl = `${hostname}${Chevereto.UploadPath}`;

  const handleUpload = async (filePath: string) => {
    const client = new Axios({
      headers: {
        "X-API-Key": key,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    const buffer = await readFile(filePath);
    const form = new URLSearchParams({
      source: buffer.toString("base64"),
      format: "json",
      key, // compatible param for v1
    });
    return client.post<string, AxiosResponse<string>>(requestUrl, form.toString()).then((res) => {
      const response: Response = JSON.parse(res.data);
      if (response.status_code === 200) {
        const url = response.image.url;
        return { url };
      } else {
        throw response.error?.message;
      }
    });
  };

  return <FormScreen source={Source.Chevereto} onUpload={handleUpload} />;
}
